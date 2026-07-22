# Local File I/O

Save and restore framejs.io frames **to and from your own disk**, with no
account and no framejs backend. A frame is just its URL, and its URL is just
text — so a frame can live in a folder, in git, on a USB stick, anywhere.

This is for you if you want to:

- **Version frames in git** — real line-by-line diffs of `code.js`, not an opaque URL blob.
- **Work fully offline / self-hosted** — nothing is stored on a server; the only
  network call is loading the framejs.io runtime itself into an iframe.
- **Live-edit a frame and have every change written straight to disk.**


## Two ways to use it

### 1. Local server — browse and live-edit (only `deno`)

A small server renders your disk as a file browser. Folders that are frames are
marked distinctly; clicking one opens the framejs.io editor **embedded against
your files**, and every edit is auto-saved back to disk (debounced).

The embedding uses [`@metapages/metapage`](https://www.npmjs.com/package/@metapages/metapage)'s
`renderMetaframe` — so the sync uses the same machinery framejs itself uses, not
a bespoke protocol. The whole server is a single file with no config; you can run
it from a local checkout or straight from GitHub.

#### Run it (deno)

```bash

# Call deno directly (no just, no clone) — runs the committed file from GitHub
deno run --allow-read=$PWD --allow-write=$PWD --allow-net --allow-env \
  https://raw.githubusercontent.com/metapages/framejs.io/main/local-server/server.ts \
  --root "$PWD" --port 4700

# From a checkout, via just — serves the current directory at http://localhost:4700
just local-server

# …or point at any folder / port / runtime origin
just local-server ~/frames 4700 https://framejs.io


```

Then open <http://localhost:4700>, navigate to a frame folder (marked
**◆ FRAME**), and start editing. The header shows `saved ✓` after each write.

#### Run it (Docker, disk mounted)

No image to build — the official `denoland/deno` image runs the committed server
file directly from GitHub, with your disk mounted at `/data`:

```bash
docker run --rm -p 4700:4700 -v "$PWD:/data" denoland/deno \
  run --allow-read=/data --allow-write=/data --allow-net --allow-env \
  https://raw.githubusercontent.com/metapages/framejs.io/main/local-server/server.ts \
  --root /data
```

Everything under the mounted `/data` is browsable and writable; nothing outside
the mount can be read or written. Pin to a commit instead of `main` (swap it into
the raw URL) if you want a fixed, reproducible version.

### 2. One-shot CLI (only `bash` + `jq` + `openssl`)

Convert between a URL and a folder from the terminal. Nothing to install beyond
tools you already have:

```bash
# URL  ->  folder (for committing to git)
just frame-save "https://framejs.io/#?js=...&options=..." my-frame/

# folder  ->  URL (printed to stdout)
just frame-restore my-frame/
just frame-restore my-frame/ "https://framejs-io.localhost:4430/"   # target a local runtime
```

See [Short URLs](./short-urls) for the URL structure these operate on.


## The on-disk format

A **directory is a frame if it contains a `code.js` file.** Everything else is
optional:

| File | Hash param | Contents |
|------|-----------|----------|
| `code.js` | `js` | Your JavaScript (required) |
| `options.json` | `options` | Editor options, e.g. `{ "autorun": true }` |
| `inputs.json` | `inputs` | Input values |
| `definition.json` | `definition` | Metaframe definition / custom hash-param whitelist |
| `og.json` | `og` | Open Graph title/description/image |
| `modules.json` | `modules` | Extra module URLs |
| `params.json` | *(the rest)* | Any other hash params, preserved verbatim |

Only `code.js` is required; the JSON files are written when the frame has that
state and omitted otherwise. Because these are plain files, they diff and merge
like any other source.


## Inputs served from your own machine

An input can point at a server running on your own machine, by giving it a URL
value in `inputs`:

```json
{ "data": { "type": "url", "value": "http://localhost:8000/data.json" } }
```

The frame fetches it at run time like any other URL input, so a big dataset
never has to go into the URL. `localhost`, `127.0.0.1` and `*.localhost` all
work.

::: warning Your server must send CORS headers
The frame page is served from `https://framejs.io`, so reading your local server
is a **cross-origin** request and the server has to opt in:

```
Access-Control-Allow-Origin: *
```

Without it the fetch is blocked, and **the failure is quiet**: the input simply
arrives as `undefined` and the only trace is an error in the browser console.
If a local input looks like it "isn't arriving", check there first.

This rules out `python -m http.server`, which sends no CORS headers. Something
like `npx http-server --cors` does. Recent Chrome versions may additionally
require `Access-Control-Allow-Private-Network: true` (or prompt for local
network access) before a public site may read a local address.
:::

Local inputs are for **you, on this machine** — nobody else can reach your
`localhost`. When you click **Create expiring snapshot**, framejs therefore
copies the content of each local input into the file store first and rewrites
the reference to the permanent `https://framejs.io/f/<sha256>` URL, so the
snapshot works for everyone you send it to. Points worth knowing:

- **Content leaves your machine at that moment.** Only the inputs that point at
  a local address, and only when you snapshot. Ordinary editing uploads nothing.
- **The snapshot is abandoned if a local input can't be fetched**, with an error
  toast naming the URL — better than minting a link that is broken for everyone
  but you.
- **It happens before the URL is computed**, so the snapshot's sha256 covers the
  rewritten inputs, and re-snapshotting doesn't upload the same bytes again.

## Notes

- **Write scope is the mounted root only.** The server refuses any path that
  escapes `--root`, and only ever writes `code.js` / `*.json` inside frame folders.
- **The design matches the live site.** The server loads `blueprint.css` from the
  configured runtime origin, so it looks like framejs.io (fonts fall back to your
  system stack if the live fonts aren't reachable).
- **Independent of framejs persistence.** This is unrelated to short URLs and
  durable Frames — see [Persistence & Retention](./persistence). Local files are
  yours alone; editing uploads nothing. (The one exception is deliberate:
  snapshotting a frame with local inputs, above.)
