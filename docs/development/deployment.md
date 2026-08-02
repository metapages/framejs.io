# Deployment

## Website (Deno Deploy)

The website at [framejs.io](https://framejs.io) is deployed to [Deno Deploy](https://deno.com/deploy).

```bash
just publish
```

This command:
1. Builds the editor frontend (`just editor/build`)
2. Copies `editor/dist/` and worker files into a `deploy/` directory
3. Runs `deployctl deploy --project=metaframe-js --prod server.ts`

Requires `DENO_DEPLOY_TOKEN` env var (or interactive login).

Optional: set `UMAMI_HOST` and `UMAMI_WEBSITE_ID` in the Deno Deploy project
env to enable cookieless server-side usage analytics
(see [worker docs](./worker.md#analytics-optional)).

## File storage (Cloudflare R2)

Uploaded files live in an R2 bucket exposed at a custom domain
(`files.framejs.io`). `GET /f/:id` on the worker is a **302 redirect** to
`${S3_PUBLIC_URL}/<id>` — the worker never serves the bytes. That means the
browser's CORS check lands on R2's response, not ours, so **R2 must be
configured to serve these files cross-origin**.

Env vars on Deno Deploy: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_URL`,
`S3_UPLOAD_MAX_SIZE_MB` (see
[bucket setup steps](../../editor/README-developer.md#production-setup-cloudflare-r2)).

### Required: unconditional CORS + cache headers

The bucket CORS policy alone is **not sufficient**. R2 only emits
`Access-Control-Allow-Origin` when the request carries an `Origin` header, and
that header-less variant comes back with no `Vary` and no `Cache-Control`. So
any non-CORS load of the same URL — an `<img>` tag without `crossorigin`, an OG
crawler, a prefetch — caches a copy with no CORS header, and a later `fetch()`
reuses it and fails with:

```
Access to fetch at 'https://files.framejs.io/f/<hash>'
(redirected from 'https://js.mtfm.io/f/<hash>')
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is
present on the requested resource.
```

Fix it with a **Cloudflare Transform Rule** (Rules → Transform Rules → Modify
Response Header) on `files.framejs.io`, applied to **all** requests so the
headers are present whether or not an `Origin` was sent:

| Action | Header | Value |
| --- | --- | --- |
| Set static | `Access-Control-Allow-Origin` | `*` |
| Set static | `Cache-Control` | `public, max-age=31536000, immutable` |
| Remove | `Vary` | — |

Content is content-addressed (sha256), so `immutable` is safe. Removing `Vary`
collapses the with-`Origin` and without-`Origin` variants into a single cache
entry — with ACAO now always `*`, varying on `Origin` only recreates the split
that caused the bug.

> ⚠️ Use **Set static**, not **Add**. `Add` appends, so on requests that *do*
> carry an `Origin` you'd get R2's header *plus* the rule's —
> `Access-Control-Allow-Origin: *, *` — which browsers reject outright. That
> turns an intermittent failure into a total one. `Set` overwrites.

The bucket CORS policy stays as it is (`AllowedOrigins: ["*"]`,
`AllowedMethods: ["GET","PUT","HEAD"]`, `AllowedHeaders: ["*"]`,
`ExposeHeaders: ["ETag"]`). Nothing in that policy can fix this — R2 derives its
CORS response headers from the request's `Origin`, so there is no bucket-side
setting for "send the header unconditionally". The Transform Rule is the fix;
the policy still governs preflights and `PUT` uploads.

Verify — the header must be present in **both** of these:

```bash
U=https://files.framejs.io/f/<known-hash>
curl -sSI "$U"                                   # no Origin — must still have ACAO
curl -sSI -H "Origin: https://js.mtfm.io" "$U"   # with Origin
```

If the no-`Origin` request has no `Access-Control-Allow-Origin`, the rule is
missing and cross-origin frame loads will fail intermittently — the tell is that
it reproduces for a user but not with DevTools "Disable cache" checked.

> The alternative fix is to proxy the bytes through `GET /f/:id`
> (`worker/server.ts`) instead of redirecting, which makes files same-origin and
> sidesteps CORS entirely — at the cost of routing file traffic through Deno
> Deploy. We redirect.

### Edge caching (Cache Rule)

By default these objects are **not** edge-cached — `cf-cache-status: DYNAMIC` on
every request, so every file load is an R2 **Class B** operation. Cloudflare's
default cache eligibility keys off file extension, and our URLs are bare sha256
hashes with no extension, so nothing qualifies no matter what `Cache-Control`
says. A Cache Rule is required to opt them in.

What this does and does not save:

- R2 egress is **already $0** — that's the reason we're on R2, and caching does
  not change it.
- What caching saves is Class B operations (~$0.36/million, first 10M/month
  free). A cache HIT never reaches R2, so it costs nothing at all.
- At low volume the dollar saving is pennies; the real wins are latency (served
  from the edge POP, not the bucket) and headroom — staying inside the free
  Class B allowance as frame traffic grows.

Rules → **Cache Rules** → Create rule, on the `framejs.io` zone:

| Field | Value |
| --- | --- |
| Expression | `http.host eq "files.framejs.io"` |
| Cache eligibility | **Eligible for cache** |
| Edge TTL | **Ignore cache-control header and use this TTL** → `1 month` |
| Browser TTL | **Respect origin TTL** |

> ⚠️ **Edge TTL must be the "ignore cache-control" option.** Response header
> transform rules run *after* the cache in Cloudflare's request pipeline, so the
> cache sees R2's raw response — which has **no** `Cache-Control` at all. The
> `immutable` header from the Transform Rule above is only ever seen by the
> client. Choosing "use cache-control header if present, bypass cache if not"
> would therefore bypass the cache on every request and silently do nothing.

Leave Browser TTL on *respect origin* — the Transform Rule already sets what the
browser sees, and a Browser TTL here would just be overwritten by it downstream.

Verify with **GET**, not HEAD (the second request must be a `HIT`):

```bash
U=https://files.framejs.io/f/<known-hash>
curl -sS -o /dev/null -D - "$U" | grep -i cf-cache-status   # MISS on first fetch
curl -sS -o /dev/null -D - "$U" | grep -i cf-cache-status   # HIT
```

> ⚠️ `curl -I` sends a **HEAD** request, and Cloudflare only caches `GET`. HEAD
> always reports `cf-cache-status: DYNAMIC` no matter how correct the rule is —
> it is not evidence of anything. Use `-o /dev/null -D -` to issue a real GET and
> discard the body. (`curl -I` is still fine for the CORS checks above, which
> only inspect headers.)

A `DYNAMIC` on a real GET means the rule isn't matching — the object was never
considered cacheable. Note POPs cache independently, so a `MISS` right after
deploying is expected.

Cache entries are keyed **per `Origin`**: each distinct embedding origin, plus
the no-`Origin` variant, gets its own entry. This is R2's `Vary: Origin` again —
the cache sees R2's raw response, and the Transform Rule's `Vary` removal runs
downstream of it. Harmless (every variant carries ACAO `*` on egress) and the
multiplier is small in practice, so we accept it. If heavy third-party embedding
ever makes it worth fixing, the Cache Rule cache-key setting
`header.exclude_origin` drops `Origin` from the key — check plan availability,
some header cache-key customization is Enterprise-only.

Note this compounds the object-lifecycle caveat: uploads are deleted from the
bucket after 7 days, but a 1-month edge TTL means the edge keeps serving a file
whose R2 object is already gone. For content-addressed URLs the bytes can never
differ, so this is harmless-to-useful, but it does mean deletion is not
immediately effective. Use a single-file purge if an object ever needs to
actually disappear.

## Python package (PyPI)

The `metaframe-widget` package is published to PyPI:

```bash
just build-python    # builds python/dist/
just publish-python  # publishes to PyPI
```

Requires `HATCH_INDEX_USER` and `HATCH_INDEX_AUTH` env vars, or interactive login.

### CI publishing

Push a git tag to trigger CI:

```bash
git tag python-v0.1.0 && git push origin python-v0.1.0
```

---

**Developer docs:** [Index](./README.md) · [Local Setup](./local-setup.md) · [Architecture](./architecture.md) · [Editor](./editor.md) · [Worker](./worker.md) · **Deployment**
