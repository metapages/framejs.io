---
description: Generate browser JavaScript and open it at framejs.io
argument-hint: "[short URL or sha256] [description of changes], or [description of what to create], with optional local file paths"
allowed-tools: Bash(node *), Read
---

<!-- GENERATED FILE — do not edit. Source of truth: worker/static/skill/framejs/ (regenerate with `just build-skill`). -->
<!-- Prefer the portable `framejs` Agent Skill: https://framejs.io/skill/framejs/SKILL.md -->

You generate JavaScript that runs at https://framejs.io — a hosted web app that
executes an ES6 module from the URL. The ONLY output you produce is the result
of running a node command that creates a short URL and opens it in the browser.

# USER REQUEST: $ARGUMENTS

`$ARGUMENTS` can be: (1) a description to create from scratch; (2) a short URL
(`https://framejs.io/j/<sha256>`) or bare 64-char hex id plus a change request —
fetch and modify the existing app; (3) local file paths to visualize — upload
and pass as inputs.

# HOW TO DELIVER (this is a standalone command — use the inline-node commands below)

ALWAYS deliver by creating a short URL and printing it. NEVER create HTML files,
NEVER write local .js files, NEVER output a code block for the user to copy, and
NEVER build a long URL with the code in the hash. On every update, create a NEW
short URL.

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

# LOCAL FILE INPUTS

When the request references local file paths (e.g. `./data.csv`,
`/tmp/results.json`), upload each file to framejs.io and pass them as `inputs`.
The result is a standalone, shareable app powered by the uploaded data — anyone
who opens the link sees the visualization with no local files needed.

## Step 1 — inspect the file

Read the file to understand its structure so you can generate appropriate
visualization code (column names, shape, types, etc.).

## Step 2 — upload each file

```bash
node scripts/framejs.mjs upload ./data/sales.csv
# → {"name":"sales.csv","url":"https://framejs.io/f/abc123...","contentType":"text/csv"}
```

The helper computes the SHA256, detects the content type from the extension,
gets a presigned URL from `POST /api/upload/presign`, and `PUT`s the bytes to
S3. Uploaded files are content-addressed (same bytes → same URL) and persist.

### Inline fallback

```bash
node -e "
const fs = require('fs'), crypto = require('crypto'), path = require('path');
const filePath = '<LOCAL_FILE_PATH>';
const buf = fs.readFileSync(filePath);
const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
const ext = path.extname(filePath).toLowerCase();
const types = { '.json':'application/json', '.csv':'text/csv', '.tsv':'text/tab-separated-values', '.txt':'text/plain', '.xml':'text/xml', '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml', '.webp':'image/webp', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.mp4':'video/mp4', '.pdf':'application/pdf' };
const contentType = types[ext] || 'application/octet-stream';
fetch('https://framejs.io/api/upload/presign', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contentType, fileSize: buf.length, sha256 }) })
  .then(r => r.json())
  .then(async ({ presignedUrl, canonicalPath }) => {
    await fetch(presignedUrl, { method:'PUT', headers:{'Content-Type':contentType}, body: buf });
    console.log(JSON.stringify({ name: path.basename(filePath), url: 'https://framejs.io' + canonicalPath, contentType }));
  })
  .catch(e => console.error(e));
"
```

## Step 3 — build the `inputs` object

Inputs are DataRef objects with `type` and `value`. For uploaded files use type
`url`:

```json
{
  "data.csv": { "type": "url", "value": "https://framejs.io/f/abc123..." },
  "config.json": { "type": "url", "value": "https://framejs.io/f/def456..." }
}
```

Pass `inputs` in the frame body alongside `js` (see `short-url-api.md`). With
the helper script:

```bash
cat app.js | node scripts/framejs.mjs create \
  --input 'data.csv={"type":"url","value":"https://framejs.io/f/abc123..."}' \
  --title "Sales dashboard" --description "Bar chart of monthly sales from the uploaded CSV"
```

## Step 4 — handle the resolved inputs in code

The runtime resolves URL DataRefs **before** calling `onInputs()`, based on the
file's Content-Type:

| Content-Type                | Value passed to `onInputs` |
| --------------------------- | -------------------------- |
| `application/json`          | parsed JSON object         |
| `text/*` (csv, tsv, xml, …) | plain string               |
| `image/*`                   | `Blob`                     |
| other                       | `Blob`                     |

Your code receives the RESOLVED data (not the URL). The input name must match
the key in the `inputs` object:

```js
export function onInputs(inputs) {
  const csvText = inputs["data.csv"]; // string (text/csv)
  const config = inputs["config.json"]; // parsed object (application/json)
  // render using the data
}
```

**Upload files BEFORE creating the frame** — you need the upload URLs to
populate `inputs`.

# BROWSER JAVASCRIPT CODING GUIDE

The code runs as an **ES6 module in the browser**, inside an iframe. It is NOT
Node.js — use browser APIs only. `"use strict"` is added automatically; do not
include it. Top-level `await` is supported.

## Critical constraints

- **MUST use ES6 module syntax** — exported handlers:
  - ✅ `export function onInputs(inputs) {}`
  - ✅ `export const onInputs = (inputs) => {}`
  - ❌ `function onInputs(inputs) {}` — missing `export`!
- **Never modify** `root.style.position`, `root.style.height`, or
  `root.style.width` — it breaks the editor layout. To size content, create a
  child `div` with `width:100%; height:100%` and style that instead.
- **Always clear** `root` before building DOM: `root.innerHTML = ""`.

## Pre-defined globals (no import needed)

```js
setOutput("outputName", value); // send one output
setOutputs({ out1: "val", out2: 42 }); // send multiple outputs
log("message"); // visual log — writes to the display
logStdout("message"); // stdout log
logStderr("error"); // stderr log
root; // the display div, already exists
root.innerHTML = "<h1>Hello</h1>";
root.getBoundingClientRect().width;
```

For graphical apps use `console.log()` (not `log()`, which writes to the
display).

Output value types: strings, numbers, booleans, objects, arrays, `ArrayBuffer`,
`Uint8Array`, and other typed arrays.

## Exports

```js
// Handle inputs (required)
export function onInputs(inputs) {
  const data = inputs["input.json"];
  render(data);
}

// Handle resize (optional but recommended)
export function onResize(width, height) {
  // Update visualization for new dimensions
}

// Cleanup (optional, for dev iterations)
export function cleanup() {
  // Remove listeners, clear intervals
}
```

## Common patterns

**Visualization** — build DOM once in the main script body, then update elements
in `onInputs` (do not recreate the DOM each time):

```js
root.innerHTML =
  `<div style="width:100%;height:100%"><h1 id="title">Title</h1></div>`;
export function onInputs(inputs) {
  document.getElementById("title").innerHTML = inputs["data"].title;
}
```

**Process and output:**

```js
export async function onInputs(inputs) {
  const processed = inputs["raw"].map((x) => x * 2);
  setOutput("result.json", processed);
}
```

**External libraries** — prefer ES6 imports from a CDN (`/+esm`):

```js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
d3.select(root).append("svg").attr("width", 500);
```

## Key details

- No need to wait for `DOMContentLoaded` — code runs after the page loads.
- `setOutput` is fire-and-forget (async, no return value).
- Prevent scroll propagation to the parent page when needed:

  ```js
  window.addEventListener("wheel", (e) => {
    if (myDiv.contains(e.target)) e.preventDefault();
  }, { passive: false });
  ```

- Persist state in the URL hash (portable, shareable):

  ```js
  import {
    getHashParamValueJsonFromWindow,
    setHashParamValueJsonInWindow,
  } from "https://cdn.jsdelivr.net/npm/@metapages/hash-query@0.10.0/+esm";

  setHashParamValueJsonInWindow("state", { zoom: 2 });
  const state = getHashParamValueJsonFromWindow("state");
  ```

## Common mistakes

- ❌ Creating an HTML file — never create HTML files.
- ❌ Writing a local `.js` file — never write files.
- ❌ `function onInputs(inputs) {}` — not exported.
- ❌ `root.appendChild(el)` before clearing — clear `root.innerHTML` first.
- ❌ Including `"use strict"` — added automatically.
- ❌ Changing `root.style.position` / `height` / `width`.
- ❌ Writing a Node.js script — this runs in the BROWSER.

## CDN libraries (use `/+esm` ES6 imports unless noted)

- **2D/3D plots:** Plotly (preferred)
  `import "https://cdn.plot.ly/plotly-3.3.0.min.js"`; d3
  `import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"`
- **2D plots:** echarts
  `import * as echarts from "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.esm.min.js"`
- **2D animation/easing:** gsap
  `import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm"`
- **Sound:** howler
  `import howler from "https://cdn.jsdelivr.net/npm/howler@2.2.4/+esm"`; tone
  `import * as Tone from "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm"`
- **Creative/custom:** p5
  `import "https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.min.js"`
- **2D physics:** matter
  `import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm"`
- **3D objects/physics/rendering:** babylon
  `import "https://cdn.babylonjs.com/babylon.js"`

### Classic scripts (NOT ES6 — go in the `modules` array, not an import)

Some libraries are classic scripts that attach globals rather than ES6 modules.
Put their URLs in the `modules` array of the frame body (see `short-url-api.md`)
instead of `import`-ing them:

- 3Dmol.js: `https://3dmol.org/build/3Dmol-min.js`
