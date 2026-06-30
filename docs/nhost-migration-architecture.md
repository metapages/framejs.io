# framejs.io — Architecture Breakdown & nhost.io Migration Context

> **Purpose of this document.** This is an LLM-context / architecture reference for
> taking the current **framejs.io** application (a Deno + Hono "worker", a React
> "editor", composed via iframe using the metapage protocol, with **no
> authentication and no database**) and re-hosting it inside an **nhost.io** stack
> (Postgres + Hasura GraphQL + nhost Auth + nhost Storage) where the app is served
> in the context of a typical multi-user app with login.
>
> It has two halves:
> 1. **Part A — Current architecture** (the source of truth: systems, data flow,
>    the iframe model, where state lives).
> 2. **Part B — Target nhost architecture** (how to wrap/port it, the auth layer,
>    and a system-by-system migration map).

---

## TL;DR for an LLM picking this up

- framejs.io is **almost entirely stateless**. The *entire app a user creates* (the
  JavaScript code, modules, inputs, options, styling, OG metadata) is encoded into
  the **URL hash fragment** (`#?js=...&modules=...&inputs=...`). There is no
  per-user data, no sessions, no login, no database tables.
- The **worker** (Deno/Hono, deployed to Deno Deploy) is a thin layer: it serves
  one `index.html`, serves the React `editor` and `docs` as static files, proxies
  uploads/short-URLs to **S3** (Cloudflare R2 in prod, MinIO locally), and fires
  fire-and-forget analytics to Umami. **No auth middleware exists anywhere.**
- The only server-side persistence is **S3 objects keyed by content hash**:
  - `j/<sha256>` → a saved "short URL" (the hash-param blob of one app).
  - `f/<id>` → an uploaded file (input data for an app).
  - Both are content-addressed and **ownerless** — anyone with the hash can read.
- The **editor is an iframe** mounted *over* the running app, wired through the
  **metapage/metaframe postMessage protocol** (`@metapages/metapage`). The two
  frames synchronize purely by **mirroring the URL hash** back and forth.
- **The migration is fundamentally: (1) put an auth shell around/above the runtime,
  (2) replace the ownerless content-addressed S3 store with user-owned rows in
  Postgres/Hasura, (3) keep the hash-param runtime essentially untouched.** The
  existing iframe-composition pattern is the natural template for the auth shell.

---

# PART A — CURRENT ARCHITECTURE

## A.1 The three deployable systems

| System | Tech | Location | Role | Deployed |
|---|---|---|---|---|
| **worker** | Deno + Hono | `worker/` | HTTP router, serves `index.html` (the runtime), static host for editor + docs, S3 facade (presign / shorten / fetch), analytics beacon | Deno Deploy (`deno deploy --prod`) → framejs.io / js.mtfm.io |
| **editor** | React 18 + Vite + Chakra UI v2 + Zustand | `editor/` | The code editor / settings UI, built to static assets, served by worker at `/editor`, **runs as an iframe** | Built into `worker`'s static dir at build time |
| **docs** | VitePress | `docs/` | Static documentation site, served at `/docs` | Built into `worker`'s static dir |

Supporting infra (local dev via `docker-compose.yml`): **traefik** (TLS/routing),
**minio** + **minio-init** (local S3, bucket `uploads`, 7-day expiry). Production
swaps MinIO for **Cloudflare R2** and routes through Deno Deploy.

There is **no database container, no auth service, no user store** anywhere in the
stack today.

## A.2 The central idea: the app *is* the URL

framejs.io is an instance of the **metaframe** concept (`@metapages/metapage`,
`@metapages/hash-query`). A "metaframe" is a single HTML page whose entire behaviour
is parameterized by its **URL hash fragment**. Canonical hash params
(`worker/src/metaframe-definition.ts`, mirrored in `worker/server.ts`
`CANONICAL_HASH_PARAM_KEYS` and `editor/src/utils/hashParams.ts`):

| Param | Type | Meaning |
|---|---|---|
| `js` | base64(uriencode(code)) | The user's JavaScript program (the app) |
| `modules` | json string[] | Script/CSS URLs or an import-map to load before running |
| `inputs` | json | Input data, as DataRef objects (`{type,value}`; type ∈ base64/utf8/json/url/key) |
| `definition` | json | Optional override of the metaframe definition (extra hash params, inputs/outputs, metadata) |
| `options` | json | `debug`, `disableCache`, `disableDatarefs`, `disableSmartInputUnpacking` |
| `og` | json | Open Graph `{title,description,image}` for link previews |
| `bgColor`, `editorWidth`, `edit`, `hm` | string/bool | Presentation: background, editor width, edit-mode flag, menu-button visibility |
| `css` | base64 (transient, **not** canonical) | Runtime-only global stylesheet; never persisted into definitions/short URLs |

Because all of this lives in the hash (after `#`), it **never reaches the server on
a normal load** — the server only sees the path. This is why the app needs no
backend state to render a shared app.

## A.3 The runtime (`worker/index.html`) — what actually runs the user's code

`worker/index.html` is a ~2100-line self-contained document (no build step for the
runtime itself). Load sequence:

1. **Landing content** shows only if there is no `js=` param and no short URL
   pending (`#landing-content` toggled by inline script).
2. **Service worker** (`/sw.js`) registers **only on production hosts**
   (`framejs.io`, `js.mtfm.io`) or `?sw=force`; provides stale-while-revalidate
   caching of CDN assets and S3 URLs. In dev it actively *unregisters* itself.
3. **import-map-loader** (module script): if `__SHORT_URL_READY` exists, it
   `await`s it first (see A.5); imports `@metapages/hash-query` and
   `@metapages/metapage` from jsDelivr CDN; installs an import-map if one is present
   in `modules`.
4. **Module loading** (`ensureModulesLoaded`): each entry in `modules` is appended
   to `<head>` as `<script>`/`<link>` (or recognised as an import-map) and awaited.
5. **`runJsFromUrl()`** — the heart:
   - reads `js` from the hash, wraps it `"use strict"`, turns it into a **Blob
     object-URL**, and `await import()`s it as an ES module.
   - exposes globals to user code: `root` (the DOM mount), `setOutput(k,v)`,
     `setOutputs(o)`, `log`/`logStdout`/`logStderr`, `metaframe`, `metapage`.
   - if the user module exports `onInputs`, `onResize`/`handleResize`,
     `cleanup`/`dispose`/`unload`, the runtime calls them on the relevant events.
   - wires a `ResizeObserver` and the metaframe input pipeline (datarefs are
     resolved via `resolveDataRef`; JSON blobs auto-unpacked via
     `smartUnpackInputs` unless disabled).
6. **hashchange handling**: a *filtered* snapshot of execution-relevant params is
   compared so that metadata-only params (`og`, `css`) don't force a full JS re-run;
   `css` is re-applied live, everything else re-runs `runJsFromUrl()`.

So: **the worker serves a static document; the user's "app" executes 100% in the
browser** from data carried in the URL.

## A.4 The editor-as-iframe model (the pattern the auth layer should reuse)

This is the architecturally important part for the migration. The editor is **not**
part of the runtime page — it is a *separate origin-path React app* (`/editor`)
that the runtime page **embeds as an iframe and composes via the metapage
protocol**. From `index.html`:

```
metapageDef = {
  metaframes: { editor: { url: `${origin}/editor/#?c=...` } },
  version: "0.3",
}
```

Flow when the user clicks the "Edit" (`#menu-button`) pencil (`onMenuClick`):

1. Runtime sets `edit=true` in its own hash, lays out a split view (`root` shrinks
   to `calc(100% - editorWidth)`, `editor-root` grows).
2. It copies its **current hash into the editor iframe's URL**
   (`editorUrl.hash = window.location.hash`).
3. It boots a **Metapage** (`Metapage.from(metapageDef)`), grabs the `editor`
   metaframe's `iframe`, and appends it to `#editor-root`.
4. It pushes current inputs into the editor via `metapageEditor.setInputs({editor: ...})`.
5. It **listens** for `Metapage.DEFINITION` change events; when the editor changes
   the code, the editor's iframe URL hash changes, the event carries the new
   `metaframes.editor.url`, and the runtime **copies that hash back onto its own
   `window.location.hash`** (debounced 400ms) → which triggers `hashchange` →
   re-runs the user JS.

**The contract between the two frames is just the URL hash + metapage
postMessage.** No shared globals across origins, no backend. The editor
(`editor/src/`) is a normal React app: `App.tsx` switches between `PanelCode`
(Monaco-like code editor), `PanelSettings`, `PanelLlms`; state that matters is read
from / written to the hash via `@metapages/hash-query/react-hooks`
(`useHashParamBase64`, `useHashParamJson`, etc.). `store.ts` (Zustand) holds only
ephemeral UI state (which panel is shown, file-upload trigger) — **nothing
persistent**.

> **Migration relevance:** an nhost auth shell can host the *entire framejs runtime*
> as an iframe in exactly this way — the shell owns login/session, and hands the
> runtime an app via the hash (or via postMessage), identically to how the runtime
> hands the editor an app today.

## A.5 Server endpoints (`worker/server.ts`) and data flow

All routes are **unauthenticated**. CORS is `origin: "*"` globally.

**Page serving**
- `GET /` → serves `index.html`; fires analytics pageview + (if framed) an `embed`
  event with the embedding origin.
- `GET /index.html`, `GET /sw.js`, `GET /cache-test-utils.js` → static runtime files.
- `GET /metaframe.json`, `GET /editor/metaframe.json` → the default metaframe
  definition (capability descriptor).
- `USE /editor/*`, `/docs/*`, `/*` → static file serving (the catch-all rewrites to
  `/static/*`, where `llms.txt`, `robots.txt`, the agent skill tarball, etc. live).

**File uploads (S3 presign, direct browser→S3)**
- `POST /api/upload/presign` `{contentType, fileSize, sha256}` → returns
  `{presignedUrl, canonicalPath:"/f/<id>", key:"f/<id>", id}`. Browser PUTs the file
  straight to S3 using `presignedUrl`. `id` = content sha256 (dedup) or random UUID.
- `GET /f/:id` → 302 redirect to the public S3 URL (`S3_PUBLIC_URL/<id>`).

**Short URLs (save an app)**
- `POST /api/shorten` `{hashParams}` → server computes sha256 of the hash blob,
  stores it at S3 key `j/<sha256>`, returns `{id, path:"/j/<sha256>"}`.
- `POST /api/shorten/json` `{js, modules, inputs, ...}` → encodes each field into a
  hash string (respecting each param's type), sha256s it, stores it, returns
  `{id, shortUrl, fullUrl, hashParams}`. **This is the AI/CLI entry point** (the
  agent skill posts here).
- `GET /j/:sha256` → fetches the blob from S3 and serves a **modified `index.html`**:
  it injects OG meta tags (extracted from the stored `og`) and a bootstrap
  `<script id="short-url-init">` that sets `window.__SHORT_URL_ID/__READY` and
  fetches the full hash async. The big hash blob is **not** inlined — crawlers see
  OG tags cheaply; the runtime hydrates the hash from the API after load. This is
  the `__SHORT_URL_READY` promise the runtime awaits in A.3 step 3.
- `GET /api/j/:sha256` → JSON `{id, hashParams(decoded)}`.
- `GET /api/j/:sha256/url` → the full `#...` URL as plain text (used by the bootstrap).
- `GET /j/:sha256/metaframe.json` → computed effective definition for that app.
- `GET /j/:sha256/qrcode.png` → PNG QR code of the canonical short URL (`PUBLIC_ORIGIN` pinned).

**Analytics (`worker/src/analytics.ts`)** — server-side, cookieless Umami beacon.
`detectSource()` segments `skill` / `browser` / `api-other`; `detectEmbed()` reads
`Sec-Fetch-Dest` + `Referer` to record where the app is embedded. Fire-and-forget,
no-op if env unset. **No PII, no user identity** — purely aggregate.

### Data-flow diagram (current)

```
            ┌──────────────────────────── browser ────────────────────────────┐
            │                                                                  │
            │  index.html (runtime)         /editor (React, iframe)            │
            │   - reads hash params  ◄── metapage postMessage ──►  - edits hash│
            │   - import() user JS                                  - settings │
            │   - resolves DataRefs                                            │
            │        ▲      │ PUT file (presigned)         ▲ fetch hash blob   │
            └────────┼──────┼──────────────────────────────┼──────────────────┘
                     │      │                               │
        GET / , /j/<sha>    │  POST /api/upload/presign     │ GET /api/j/<sha>/url
                     │      ▼                               │
            ┌────────┴───────────── worker (Deno/Hono, Deno Deploy) ──────────┐
            │  static serve · presign · shorten · fetch · qrcode · analytics  │
            └───────┬───────────────────────────┬─────────────────────┬──────┘
                    │ PutObject/GetObject        │ presigned PUT/GET   │ /api/send
                    ▼                            ▼                     ▼
            S3 (R2 / MinIO):  j/<sha256> = app blob ,  f/<id> = file        Umami
            (content-addressed, OWNERLESS, public-read)
```

## A.6 Critical properties to preserve

- **Shareability without accounts**: a URL alone fully reconstructs an app. Any auth
  layer must keep "open this link and it just runs" working for *published/anonymous*
  apps, or it breaks the core value proposition and all existing embeds.
- **Content-addressing & immutability**: `j/<sha256>` and `f/<id>` are immutable and
  cached `immutable`. Saving the same content twice is idempotent.
- **Embeddability**: apps are embedded as iframes in Notion/Confluence/blogs. Auth
  must not force a login wall on embeds of public apps.
- **Runtime executes arbitrary user JS** via blob import — this is a deliberate
  capability, and a **security boundary consideration** for any authenticated multi-
  tenant context (see B.5).

---

# PART B — TARGET nhost.io ARCHITECTURE

## B.1 What nhost gives you (mapping targets)

nhost is an opinionated full-stack BaaS:

| nhost service | What it is | Replaces / adds in framejs |
|---|---|---|
| **Postgres** | The database | New: persistent, **user-owned** saved frames, instead of ownerless S3 blobs |
| **Hasura GraphQL** | Auto GraphQL API over Postgres with row-level permissions via JWT claims | New: the read/write API for frames, replacing `/api/shorten` & `/api/j/*` |
| **nhost Auth** (GoTrue-derived) | Email/password, magic link, OAuth, JWT issuance + refresh | New: **the authentication layer** (none exists today) |
| **nhost Storage** | S3-backed file storage with Hasura-permissioned metadata | Replaces the raw S3 presign/`f/<id>` flow for uploaded inputs |
| **nhost Functions** | Serverless TS functions | Optional: host the remaining bespoke logic (sha256 short-URL minting, QR codes, OG injection, analytics) that has no Hasura-native equivalent |
| **nhost JS SDK** (`@nhost/nhost-js`, `@nhost/react`) | Client with auth-aware GraphQL + storage | Used by the **auth shell** frontend |

## B.2 Recommended topology: an "auth shell" that hosts the runtime as an iframe

The cleanest migration reuses the pattern in A.4. Introduce a **new outer frontend
("the shell")** — an nhost React app — that owns identity, and treat the existing
framejs **runtime as an embedded surface**, exactly as the runtime today embeds the
editor.

```
┌──────────────────────── nhost app (the SHELL, authenticated) ───────────────────────┐
│  @nhost/react: <NhostProvider> + <NhostApolloProvider>                               │
│  - login / signup / session (JWT in memory + refresh cookie)                         │
│  - "My Frames" dashboard  ── GraphQL ──►  Hasura (frames owned by user_id)           │
│  - opens a frame:                                                                     │
│       <iframe src="https://run.framejs.io/#?js=...&inputs=..."> (the RUNTIME)        │
│       state synced via URL hash + metapage postMessage (UNCHANGED protocol)          │
└──────────────────────────────────────────────────────────────────────────────────────┘
         │ GraphQL (JWT)             │ storage (JWT)            │ iframe (hash/postMessage)
         ▼                           ▼                          ▼
   Hasura → Postgres          nhost Storage → S3         framejs runtime (index.html)
   (frames, ownership,         (uploaded input files,    - still stateless
    sharing/visibility)         per-user permissions)     - still executes hash params
```

Why this shape:
- **The runtime barely changes.** It keeps consuming hash params and the metaframe
  protocol. It does not need to know about nhost, JWTs, or users. Public/embedded
  apps keep working with zero auth.
- **The shell owns all identity and ownership.** Login, "my frames", sharing,
  visibility, and per-user storage are pure nhost concerns in the shell.
- **It mirrors the proven editor pattern**, so the team already understands the
  composition mechanics (hash mirroring + postMessage).

Two integration depths (pick per surface):
- **(a) Shell ⇄ runtime by hash only** (loosest): shell builds the `#?js=...` URL
  and sets the iframe `src`; reads changes back via the metapage `DEFINITION` event
  (as the runtime does for the editor today). Best when runtime stays a separate
  origin and you want minimal coupling.
- **(b) Shell embeds and also passes a session** (tighter): if the runtime ever
  needs to call authenticated APIs (e.g. autosave to Hasura), the shell forwards the
  nhost access token to the iframe via `postMessage` (never via URL). Prefer keeping
  the runtime token-free and doing saves from the shell.

> Alternative (heavier): fold the runtime *into* the nhost React app directly
> (no iframe), calling the runtime's JS via a component. Not recommended initially —
> it couples arbitrary-user-JS execution into the authenticated app's origin and
> loses the clean security boundary the iframe provides (B.5).

## B.3 Data model: from content-addressed S3 to user-owned rows

Today: `j/<sha256>` blob in S3, ownerless, public. Target: a Hasura-managed table.

Suggested Postgres schema (Hasura tracks it; `auth.users` is provided by nhost):

```sql
create table public.frames (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,  -- null = anonymous/legacy
  slug         text unique,                 -- short, human/AI friendly id for /j-style URLs
  content_hash text not null,               -- sha256 of hash_params (keeps idempotency/dedup)
  hash_params  text not null,               -- the "#?js=...&inputs=..." blob (source of truth)
  title        text,
  og           jsonb,                        -- title/description/image for link previews
  visibility   text not null default 'private'  -- 'private' | 'unlisted' | 'public'
                 check (visibility in ('private','unlisted','public')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.frames (user_id);
create unique index on public.frames (content_hash) where user_id is null; -- legacy dedup
```

Hasura **permissions** (the security model that replaces "everything is public"):
- `select`: row visible if `visibility != 'private'` **OR** `user_id = X-Hasura-User-Id`.
  → public/unlisted frames remain shareable by link without login; private frames
  require the owner's JWT.
- `insert`/`update`/`delete`: only where `user_id = X-Hasura-User-Id`.
- Anonymous role (nhost supports anonymous sign-in) maps to a limited `select` of
  public/unlisted frames — this preserves "open a link, it runs" without an account.

Keep `content_hash` so the existing idempotent "save same content = same frame"
behaviour survives, and so legacy `/j/<sha256>` links can be redirected
(`sha256 → frames.content_hash`).

### File inputs
Migrate `POST /api/upload/presign` + `f/<id>` to **nhost Storage**: the shell (or
runtime via forwarded token) requests an upload, gets a file id, stores a
`storage`-backed URL as the DataRef `value`. Public apps should use a public bucket
/ presigned read so embeds keep working; private inputs use permissioned reads.

## B.4 Endpoint migration map

| Current (worker) | Target (nhost) |
|---|---|
| `GET /` serve runtime | Runtime stays a static asset (Deno Deploy *or* nhost Functions/CDN). Shell is the new authenticated entry app. |
| `POST /api/shorten` / `/api/shorten/json` | Hasura `insert_frames` mutation (from shell, with JWT). Keep a thin **nhost Function** if you still want server-side sha256 + slug minting + the unauthenticated AI/CLI path. |
| `GET /j/:sha256` (HTML + OG inject + bootstrap) | A small **nhost Function** (or keep on the runtime host) that resolves slug/hash → `hash_params`, injects OG, serves runtime HTML. Reads via Hasura (admin secret server-side, respecting visibility). |
| `GET /api/j/:sha256` / `/url` | Hasura query `frames_by_pk` / `frames(where:{slug})`. |
| `GET /j/:sha256/qrcode.png` | nhost Function (QR generation has no Hasura equivalent). |
| `GET /j/:sha256/metaframe.json` | nhost Function or precomputed column. |
| `GET /f/:id`, `POST /api/upload/presign` | nhost Storage upload + file URL. |
| Analytics (`/api/send` Umami beacon) | Keep as-is (Umami is independent of nhost); call from shell and/or a Function. Optionally add authenticated per-user analytics in Postgres later. |
| CORS `*`, no auth | Hasura enforces JWT claims; Functions validate the nhost JWT; public frames remain readable by the anonymous role. |

## B.5 Authentication layer specifics (nhost)

1. **Provider setup (shell frontend):**
   ```tsx
   import { NhostClient, NhostProvider } from '@nhost/react'
   import { NhostApolloProvider } from '@nhost/react-apollo'
   const nhost = new NhostClient({ subdomain: '<sub>', region: '<region>' })
   // wrap app: <NhostProvider nhost={nhost}><NhostApolloProvider nhost={nhost}>…
   ```
   `useAuthenticationStatus()`, `useSignInEmailPassword()`, `useUserData()`,
   `useSignOut()` drive the login UI. nhost holds the **access token in memory** and
   the **refresh token in an httpOnly cookie**; Apollo/urql auto-attach the
   `Authorization: Bearer <jwt>` header so Hasura sees `X-Hasura-User-Id` /
   `X-Hasura-Default-Role`.

2. **JWT → Hasura claims:** nhost mints JWTs containing the
   `https://hasura.io/jwt/claims` block (`x-hasura-user-id`, allowed roles, default
   role). Hasura's row permissions (B.3) key off these. This is the entire
   authorization mechanism — no custom middleware needed for GraphQL.

3. **Anonymous / public access:** enable nhost **anonymous sign-in** (or simply
   allow the `public`/`anonymous` Hasura role unauthenticated `select` on
   non-private frames). This is what preserves "share a link, it runs, no login" and
   keeps existing embeds alive. **Do not put the runtime or public frames behind a
   login wall.**

4. **Serving authenticated vs public surfaces:**
   - `app.framejs.io` (or root) → the **shell**: requires login for the dashboard,
     creating/saving/owning frames, private frames.
   - `run.framejs.io/#...` and `/j|/slug` → the **runtime**: open to all; renders
     public/unlisted frames; for a private frame it asks the shell to authorize
     (shell fetches `hash_params` with the user's JWT and feeds the iframe).

5. **Passing identity to the runtime iframe (only if needed):** forward the nhost
   access token to the runtime via `postMessage` after `iframe.onload`, **never in
   the URL hash** (the hash is shareable and would leak the token). Strongly prefer
   keeping the runtime token-free and performing all authenticated reads/writes in
   the shell, then handing the runtime only the resolved `hash_params`.

6. **Security boundary (important):** the runtime executes **arbitrary user
   JavaScript** via blob `import()`. Keep it on a **separate origin** from the
   authenticated shell (e.g. `run.framejs.io` vs `app.framejs.io`) and sandbox the
   iframe (`sandbox="allow-scripts"` without `allow-same-origin` where possible) so
   untrusted frame code cannot read the shell's nhost session/cookies. This is the
   main reason to prefer the iframe topology (B.2) over inlining the runtime into the
   nhost React app.

## B.6 Suggested migration phases

1. **Stand up nhost** (subdomain/region), define the `frames` table + Hasura
   permissions + anonymous role. Keep the runtime exactly as-is.
2. **Build the shell**: nhost auth UI + "My Frames" dashboard (GraphQL CRUD) +
   embed the existing runtime iframe, syncing via hash/metapage.
3. **Cut over saves**: replace `/api/shorten*` calls with Hasura mutations from the
   shell (optionally a Function for the unauthenticated AI/CLI path + sha256/slug).
4. **Cut over reads / sharing**: `/j/<id>` and `/api/j/*` → Hasura-backed Function /
   queries; add visibility-aware serving. Backfill legacy S3 `j/<sha256>` → rows (or
   redirect by `content_hash`).
5. **Move file inputs** to nhost Storage; keep public buckets for embed-able inputs.
6. **Retire the bespoke worker** (or shrink it to: static runtime host + QR/OG
   Function), keep Umami analytics.

## B.7 Open decisions to confirm with the product owner

- Should **public/anonymous sharing** remain (recommended: yes — it's the core
  value prop), or does every frame now require an owner?
- Does the **runtime stay a separate origin** (recommended for the JS-execution
  security boundary) or get folded into the nhost app?
- Do you keep an **unauthenticated AI/CLI mint path** (`/api/shorten/json` for the
  Claude skill) as an nhost Function, and if so, do those frames get a system owner
  or stay anonymous?
- Migrate or just **redirect** the existing immutable `j/<sha256>` corpus?

---

## Appendix — key files (current)

- `worker/server.ts` — all HTTP routes, S3 facade, short-URL serving, OG injection.
- `worker/index.html` — the runtime (SW reg, module loading, `runJsFromUrl`, editor
  iframe mounting via metapage, hash-change re-execution).
- `worker/src/metaframe-definition.ts` — canonical hash params + definition merging.
- `worker/src/analytics.ts` — Umami server-side beacon, source/embed detection.
- `editor/src/App.tsx`, `editor/src/index.tsx` — the React editor (iframe app).
- `editor/src/hooks/useMetaframeUrl.ts`, `useShortUrlMode.ts` — hash<->editor sync.
- `editor/src/store.ts` — Zustand (ephemeral UI state only).
- `docker-compose.yml` — local stack (worker, editor, docs, traefik, minio).
- `justfile` — `just dev`, `just check`, `just deploy` (Deno Deploy).
</content>
</invoke>
