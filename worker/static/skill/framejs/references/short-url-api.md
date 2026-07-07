# Frame API (framejs.app + framejs.io)

A framejs app is fully described by its hash params (`js`, optional `modules`,
`inputs`, `og`). There are two backends:

- **framejs.app** — the account/frame layer. A frame lives at a **stable**
  `/j/<uuid>` URL whose content is **mutable**: each update POSTs the hash
  params and appends a new version. This is the primary flow. Base URL is
  `https://framejs.app` (override with `FRAMEJS_APP_ORIGIN`).
- **framejs.io** — the runtime that renders an app directly from hash params (no
  login), plus file uploads and screenshot rendering. Base URL is
  `https://framejs.io` (override with `FRAMEJS_IO_ORIGIN`; `FRAMEJS_BASE` is a
  legacy alias). Its content-addressed `/j/<sha256>` short URLs are read-only
  legacy — the helper can still `fetch` them, but new apps use framejs.app.

When a local dev checkout is present, the helper auto-loads a nearby `.env` so
both origins point at the dev stack (e.g. `https://framejs-app.localhost:5173`
and `https://framejs-io.localhost:4470`).

## Local / dev origins

You don't always run inside the checkout (another session, another repo). To
drive a **dev or self-hosted** stack without preconfiguring env, the helper
resolves the backend per run, most specific first:

1. `--app-origin <url>` / `--io-origin <url>` — explicit override.
2. the **origin of a full frame URL** passed to `--id` (create) or the `fetch`
   arg — so a URL like
   `https://framejs-app.localhost:13747/j/<uuid>?token=<key>` posts updates to
   `https://framejs-app.localhost:13747` (and its `?token=` is used as the
   bearer credential, exactly as in production).
3. the origin recorded in `--state` for a frame the session already created (so
   repeated in-place updates stay on the same stack).
4. the env/`.env` baseline (`FRAMEJS_APP_ORIGIN` / `FRAMEJS_IO_ORIGIN`), else
   the production default.

```bash
# Full local dev round-trip against a dev framejs.app — the URL's origin + token
# are honored, no FRAMEJS_APP_ORIGIN needed:
DEV="https://framejs-app.localhost:13747/j/<uuid>?token=<key>"
node scripts/framejs.mjs fetch "$DEV"                       # read current code from the dev stack
cat app.js | node scripts/framejs.mjs create --id "$DEV"    # update it on the dev stack
```

Only the framejs.app **app origin** is carried on a frame URL. The framejs.io
runtime origin (uploads, screenshots, the `/j/<sha256>` snapshot) stays on the
env/production baseline unless you also pass `--io-origin <url>` (or point
`FRAMEJS_IO_ORIGIN` at your dev runtime).

## One frame per session

A single conversation edits **one** frame at a stable URL. The helper records
the frame's uuid in a `--state <file>` JSON file (pass a scratchpad path so
sessions don't collide). The first `create` mints a UUIDv7 client-side; every
later `create` reuses it and appends a version. To start a **different** frame
in the same session, pass `--new` (or target a specific one with `--id <uuid>`).

## Create or update a frame

`POST /j/<uuid>.json` with a JSON body of hash params — the server packs and
stores them, creating the frame on first call and appending a version after:

```json
{
  "js": "raw JavaScript source (plain text)",
  "modules": ["https://cdn.example.com/classic-script.js"],
  "inputs": {
    "data.csv": { "type": "url", "value": "https://framejs.io/f/abc..." }
  },
  "og": { "title": "Short title", "description": "One-sentence summary" }
}
```

Only `js` is required. The `<uuid>` in the path has its dashes stripped (32 hex
chars). Anonymous writes are allowed: a frame created without auth is ownerless
and stays writable by anyone; an owned frame is writable only by its owner or by
a caller presenting a valid API token for that frame (`403` otherwise). The
response is the unpacked `{ key: value }` dict (the exact shape
`GET
/j/<uuid>.json` returns), `201` on create and `200` on update.

## API tokens — keep updating a frame after it's claimed

A frame the skill creates is ownerless (anonymous). Once a user **claims** it in
the framejs.app account UI, the frame gets an owner and anonymous writes stop
working — so the skill would lose the ability to update it. To avoid that, mint
an **API token** bound to the frame while it's still ownerless and send it as a
bearer credential on later updates:

- `POST /j/<uuid>/token` (no auth, allowed only while the frame is ownerless)
  mints a token and returns
  `{ "key": "<uuid>", "frame": "<uuid>", "description": "..." }`.
- Send it on updates as `Authorization: Bearer <key>` on `POST /j/<uuid>.json`.
  A valid, non-revoked token authorizes the write even after the frame is owned.

The bundled `framejs.mjs create` does this automatically: it mints a token right
after creating a frame, stores it in the `--state` file alongside the uuid, and
attaches it to every subsequent update. The frame's owner can view and
**revoke** tokens on the frame's API-tokens page; a revoked (or deleted) token
yields `403`, after which the skill can no longer update that frame.

### Capability URLs ("Copy frame for AI session")

An owner who has already claimed a frame can hand editing access to an AI
session via the app's **"Copy frame for AI session"** menu action, which mints a
token and copies a URL of the form:

```
https://framejs.app/j/<uuid>?token=<key>
```

When you're given any framejs URL, extract the uuid from its `/j/<uuid>` path
and target that frame. If the URL carries `?token=<key>`, pass the whole URL to
`--id` — the helper parses out both the uuid and the token, stores the token,
and uses it as the bearer credential on updates:

```bash
node scripts/framejs.mjs fetch "https://framejs.app/j/<uuid>?token=<key>"   # read current code
cat app.js | node scripts/framejs.mjs create --id "https://framejs.app/j/<uuid>?token=<key>"  # authenticated update
```

(`--token <key>` sets the credential explicitly if you have the key separately.)

### With the helper script

```bash
cat app.js | node scripts/framejs.mjs create \
  --state "$SCRATCH/frame.json" \
  --title "Bouncing ball" \
  --description "A ball bouncing around the canvas with gravity" \
  --screenshot \
  --module https://3dmol.org/build/3Dmol-min.js
```

It prints these lines (stdout) and opens the browser (`--no-open` to skip):

```
https://framejs.app/j/<uuid>             # primary: the account page (live-updates as you POST)
snapshot: https://framejs.io/j/<sha256>  # immutable content-addressed copy (expires ~30d)
```

It also prints a **share-link lifecycle notice to stderr that you must relay to
the user** — the two shareable URLs have very different lifetimes:

- **`/j/<uuid>` (framejs.app page)** — editable and live-updating, but an
  **anonymous (unclaimed) frame is temporary and will expire**. Tell the user to
  open it and **claim it** (free account) to keep it permanently.
- **`/j/<sha256>` (snapshot)** — an **immutable** copy of the app at this moment
  that **expires ~30 days after it is last opened**; it never reflects later
  edits. Best for a stable share/backup link.

`--screenshot` renders the app (via the no-login framejs.io run URL) and uploads
the capture as `og.image` BEFORE the POST, so a single version carries it. It
captures ONLY when the app has no `og.image` yet, and falls back to no image if
no renderer is available — so it is always safe to pass. It prefers
**Playwright** when importable (proper network-idle waiting) and otherwise uses
**system headless Chrome**. Flags: `--screenshot-wait <ms>` (default 6000),
`--screenshot-size <w,h>` (default `1200,630`). Env: `$CHROME_PATH` overrides
the Chrome binary; `$FRAMEJS_PLAYWRIGHT` points at a dir whose `node_modules`
contains Playwright.

### Inline fallback (no bundled script)

Pipe code via a quoted heredoc so the shell performs NO expansion (`$`,
backticks, and backslashes pass through verbatim — never hold the code in a
template literal). Generate the uuid once and reuse it for updates:

```bash
UUID=$(node -e "const b=require('crypto').randomBytes(16),t=Date.now();b[0]=t/2**40&255;b[1]=t/2**32&255;b[2]=t/2**24&255;b[3]=t/2**16&255;b[4]=t/2**8&255;b[5]=t&255;b[6]=b[6]&15|112;b[8]=b[8]&63|128;const h=b.toString('hex');console.log(h.replace(/(.{8})(.{4})(.{4})(.{4})/,'\$1-\$2-\$3-\$4-'))")
SLUG=${UUID//-/}
cat << 'JSCODE' | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const body = {
    js: Buffer.concat(chunks).toString(),
    modules: [/* classic-script URLs, if any */],
    og: { title: 'SHORT TITLE', description: 'ONE-SENTENCE SUMMARY' }
  };
  const app = process.env.FRAMEJS_APP_ORIGIN || 'https://framejs.app';
  fetch(app + '/j/' + process.env.SLUG + '.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Framejs-Client': 'skill/1.0' },
    body: JSON.stringify(body)
  })
  .then(r => r.ok ? console.log(app + '/j/' + process.env.SLUG) : r.text().then(t => Promise.reject(t)))
  .catch(e => console.error('Error:', e));
});
"
// YOUR GENERATED BROWSER JS CODE HERE — $vars, backticks, all special chars are safe inside the heredoc
JSCODE
```

## Open Graph preview tags (`og`) — always set when missing

`og` round-trips through the API exactly like `js` / `modules` / `inputs`, and
powers the title/description/thumbnail shown on the framejs.app page and in
shared-link unfurls.

- **New app:** ALWAYS include `og`, derived from the user's request and the code
  you generated (not placeholder text).
  - `title`: concise and specific, aim for ≤ ~60 characters.
  - `description`: ~110–150 characters; say what it shows and, if interactive,
    how to use it.
  - `image`: pass `--screenshot` and the helper captures the rendered app and
    sets `og.image` for you. It only ever fills in a MISSING image.
- **Modifying an existing app:** the `fetch` response includes `og` whenever the
  app already has one. If it exists, DO NOT recalculate it — pass the exact
  fetched object back through with `--og '<json>'`. This round-trips every
  field, including `image`, which `--title`/`--description` cannot preserve.

```bash
# Preserve the fetched og verbatim while changing the code, updating the same frame:
cat app.js | node scripts/framejs.mjs create \
  --id <uuid> \
  --og '{"title":"Existing title","description":"Existing summary","image":"https://…"}'
```

## Modify an existing frame — fetch first

When the request includes a framejs.app URL (`https://framejs.app/j/<uuid>`) or
a bare 32-char hex id, you MUST fetch the existing app BEFORE generating code:

```bash
node scripts/framejs.mjs fetch <uuid>     # or: fetch https://framejs.app/j/<uuid>
# inline fallback:
node -e "fetch((process.env.FRAMEJS_APP_ORIGIN||'https://framejs.app')+'/j/<uuid>.json').then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))"
```

`GET /j/<uuid>.json` returns the unpacked hash params directly — the exact shape
`create` accepts back:

```json
{ "js": "...", "inputs": {}, "modules": [], "og": {} }
```

- `js` is the EXISTING code — MODIFY it per the user's request; do NOT rewrite
  from scratch.
- Preserve `inputs` handling and `modules` unless the user asks to change them.
- Preserve `og` per the rules above.

Then re-run `create` with `--id <uuid>` (or with the same `--state` file) to
append the modified version to the SAME frame — the `/j/<uuid>` URL is unchanged
and any open framejs.app page updates live.

A legacy framejs.io `/j/<sha256>` (64 hex) URL can also be fetched — `fetch`
detects the length and returns `{ id, hashParams }` — then re-created as a new
framejs.app frame.
