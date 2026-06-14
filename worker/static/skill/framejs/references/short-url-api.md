# Short URL API (framejs.io)

A framejs.io app is fully described by its hash params (`js`, optional
`modules`, `inputs`, `og`). The short-URL API stores those params server-side
and returns a clean `/j/<sha256>` link. Base URL is `https://framejs.io`
(override with `FRAMEJS_BASE` when using the helper script).

## Create a short URL

`POST /api/shorten/json` with a JSON body — the server handles all encoding:

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

Only `js` is required. Response:

```json
{ "shortUrl": "https://framejs.io/j/<sha256>", "id": "<sha256>" }
```

The short URL is the primary output — **always print it**. Opening a browser is
best-effort and may fail in sandboxes. On every update/iteration, create a NEW
short URL.

### With the helper script

```bash
cat app.js | node scripts/framejs.mjs create \
  --title "Bouncing ball" \
  --description "A ball bouncing around the canvas with gravity" \
  --screenshot \
  --module https://3dmol.org/build/3Dmol-min.js
```

`--screenshot` renders the finished app and uploads the capture as `og.image`
(see the OG section below). It captures ONLY when the app has no `og.image` yet,
and falls back to the image-less URL if no renderer is available — so it is
always safe to pass. It prefers **Playwright** when importable (proper
network-idle waiting) and otherwise uses **system headless Chrome**. Flags:
`--screenshot-wait <ms>` (default 6000), `--screenshot-size <w,h>` (default
`1200,630`). Env: `$CHROME_PATH` overrides the Chrome binary;
`$FRAMEJS_PLAYWRIGHT` points at a dir whose `node_modules` contains Playwright.

### Inline fallback (no bundled script)

Pipe code via a quoted heredoc so the shell performs NO expansion (`$`,
backticks, and backslashes pass through verbatim — never hold the code in a
template literal):

```bash
cat << 'JSCODE' | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const body = {
    js: Buffer.concat(chunks).toString(),
    modules: [/* classic-script URLs, if any */],
    og: { title: 'SHORT TITLE', description: 'ONE-SENTENCE SUMMARY' }
  };
  fetch('https://framejs.io/api/shorten/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Framejs-Client': 'skill/1.0' },
    body: JSON.stringify(body)
  })
  .then(r => r.json())
  .then(data => {
    console.log(data.shortUrl);
    try {
      require('child_process').execSync(
        process.platform === 'darwin' ? 'open \"' + data.shortUrl + '\"'
        : process.platform === 'linux' ? 'xdg-open \"' + data.shortUrl + '\"'
        : 'cmd /c start \"\" \"' + data.shortUrl + '\"'
      );
    } catch(e) {}
  })
  .catch(e => console.error('Error:', e.message));
});
"
// YOUR GENERATED BROWSER JS CODE HERE — $vars, backticks, all special chars are safe inside the heredoc
JSCODE
```

## Open Graph preview tags (`og`) — always set when missing

The server renders `og:title` / `og:description` / `og:image` so the link
unfurls with a meaningful title, summary, and preview thumbnail when shared
(Slack, iMessage, social media). `og` round-trips through the API exactly like
`js` / `modules` / `inputs`.

- **New app:** ALWAYS include `og`, derived from the user's request and the code
  you generated (not placeholder text).
  - `title`: concise and specific, aim for ≤ ~60 characters (avoids truncation).
  - `description`: ~110–150 characters; say what it shows and, if interactive,
    how to use it.
  - `image`: pass `--screenshot` and the helper captures the rendered app and
    sets `og.image` for you — no need to build one by hand. It only ever fills
    in a MISSING image, so it can't clobber an existing one.
- **Modifying an existing app:** the `fetch` response includes `hashParams.og`
  whenever the app already has one. If it exists, DO NOT recalculate it — pass
  the exact fetched object back through with `--og '<json>'` (or the `og` body
  field in the inline fallback). This round-trips every field, including
  `image`, which `--title`/`--description` cannot preserve. Only when the
  fetched `og` is missing should you ADD one following the rules above. Never
  silently drop or overwrite an `og` the user (or a previous run) already set.

```bash
# Preserve the fetched og verbatim while changing the code:
cat app.js | node scripts/framejs.mjs create \
  --og '{"title":"Existing title","description":"Existing summary","image":"https://…"}'
```

## Modify an existing short URL — fetch first

When the request includes a short URL (`https://framejs.io/j/<sha256>`) or a
bare 64-char hex id, you MUST fetch the existing app BEFORE generating code:

```bash
node scripts/framejs.mjs fetch <sha256>     # or: fetch https://framejs.io/j/<sha256>
# inline fallback:
node -e "fetch('https://framejs.io/api/j/<sha256>').then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))"
```

`GET /api/j/<sha256>` returns:

```json
{
  "id": "<sha256>",
  "hashParams": { "js": "...", "inputs": {}, "modules": [], "og": {} }
}
```

- `js` is the EXISTING code — MODIFY it per the user's request; do NOT rewrite
  from scratch.
- Preserve `inputs` handling and `modules` unless the user asks to change them.
- Preserve `og` per the rules above: pass the fetched `hashParams.og` back
  through with `--og` rather than regenerating it.

Then re-create a new short URL with the modified body.
