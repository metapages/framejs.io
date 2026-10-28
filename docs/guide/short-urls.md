# Saving and Short URLs

Since all code and state is stored in the URL hash, metaframe URLs can get very long. The built-in URL shortener compresses these into compact, shareable links.

There are two forms of short URL persistence:
 - Expiring immutable URLs
 - Durable editable URLs

## Howto: Expiring immutable URLs

1. Click the **Create expiring snapshot** button in the editor header ![](./shorten-url-sha256-button.png)
2. The current hash parameters (code, inputs, options) are stored in [R2](https://www.cloudflare.com/developer-platform/products/r2/) 
3. You get a short URL `framejs.io/j/<SHA256-based short ID>`
4. Title, description, and image are supported for nice bookmarks and previews

The short URL is automatically copied to your clipboard.

If any input points at a local address (`http://localhost:…`, `127.0.0.1`),
its content is uploaded to the file store first and the reference rewritten to a
permanent `framejs.io/f/<sha256>` URL — a snapshot has to work for whoever you
send it to, and nobody else can reach your machine. If one of those inputs can't
be fetched, no snapshot is created and you get an error naming the URL. See
[Inputs served from your own machine](/guide/local-file-io#inputs-served-from-your-own-machine).

The content is immutable — the same content always produces the same short URL.
Short URLs are a **free convenience snapshot, kept for a month** and then garbage-collected. They are perfect for quick sharing, previews, and QR codes. If you need a link that lasts, save the content to a durable **Frame** on [framejs.app](https://framejs.app) — see below and 
[Persistence & Data Retention](/guide/persistence) for the full retention model
across every kind of URL.

## Howto: Durable editable URLs

1. Click the **Save to framejs.app** button in the editor header ![](./shorten-url-uuid-button.png)
2. The current hash parameters (code, inputs, options) are persisted
3. The durable editable short URL `framejs.app/j/<uuid>` opens
4. You can claim this URL for your account if authenticated


## Howto: Standalone HTML export (an offline archive)

A link, however durable, still needs the internet to run: the runtime, your npm
imports, your modules and your inputs are all fetched when the page loads. For
long-term science you may want the frame **as a file**, with everything inside.

1. Click the **Export standalone HTML** button in the editor header (the file
   icon; in a narrow editor it is in the menu)
2. The server bundles the frame into one self-contained `.html` file:
   - your code, with **every import it makes** (`https://esm.sh/…`, jsdelivr,
     import-map entries) bundled in
   - every entry of `modules` — stylesheets (with their fonts and images),
     module and classic scripts — inlined
   - every **input**, including `url` datarefs and uploaded files, inlined as
     `data:` URLs, so your code receives exactly what it did before
   - the framejs runtime itself
3. The file downloads. Open it from disk — it makes **no network requests**
   for any of the above, even with the network unplugged.

Requests your own code makes while it runs (a `fetch()` to an API, an
`import()` of a URL computed at run time, a library loading its own `.wasm`) are
outside what the export can see, and still need the network.

The file is stored on the server under the SHA-256 of its contents, at
`framejs.io/html/<sha256>`: exporting the same frame again gives the same link
and is not uploaded twice. The server copy is kept for **~30 days**: the file
you download is the archive. The un-bundled source, modules and inputs are kept,
readable, inside the file (`<script id="framejs-original">`). There is no
editor in the file, so its edit button is removed.

An export is limited to **50 MB** (everything it pulls in, and the file itself;
inlined inputs grow by roughly 1.8× on the way in). Entries in `modules` that
cannot be made network-free — an inline `<script>` with no `src`, a tag that is
not a `<script>` or `<link>` — fail the export with a message naming them,
rather than being dropped or left to make a request.

## Howto: Import a frame's functions from another frame

Add `.js` to any short URL and you get the frame's code as an **ES module of its
functions**, ready to `import` from another frame (or any browser module):

```js
import { total } from "https://framejs.io/j/<uuid>.js";
// a published version, cached forever:
import { total } from "https://framejs.io/j/<uuid>.js?v=<sha256>";
// an expiring snapshot works too:
import { total } from "https://framejs.io/j/<sha256>.js";
```

A frame's code is written to *run* — it renders into `root`, adds listeners,
fetches data. None of that happens when you import it. The module keeps only
what is safe to evaluate:

- function declarations, exported or not (the unexported ones are the helpers
  the exported ones call), and `const f = () => …` / `function () {…}`
- constants set to a plain literal (`const SCALE = 10`, `["a", "b"]`,
  `{ unit: "px" }`)
- `import` statements that bind names (your functions may use them), and
  re-exports (`export … from`)
- `export { … }` / `export default` of any of the above

Everything else is removed: top-level statements, classes,
`let x = compute()`, `await`, and side-effect-only `import "x"`. An export that
was removed is listed in a comment at the top of the module. A function that
reads something removed — or a runtime global such as `root` or `setOutput` —
throws when it is **called**, not when it is imported, so write the functions
you want to share to take what they need as arguments.

Caching follows the URL: `/j/<sha256>.js` and a published `/j/<uuid>.js?v=…` are
immutable and cached for a year; the live `/j/<uuid>.js` revalidates on every
import (a cheap `304` when unchanged), so it always serves the current version.

## Longer discussion between the two short-URL forms: `/j/<sha256>` vs `/j/<uuid>`

Both forms look alike — `framejs.io/j/…` and `framejs.app/j/…` — but they make
**very different persistence promises**. The **Create expiring snapshot** button
above creates the ephemeral `sha256` form; saving into an account creates the
durable `uuid` form.

| | `framejs.io/j/<sha256>` | `framejs.app/j/<uuid>` |
|--|--------------------------|-------------------------|
| **Identifier** | SHA-256 of the content (content-addressed) | Random UUID (a stable document handle) |
| **Backed by** | Immutable blob in object storage (R2) | Versioned rows in a database, tied to an account |
| **Mutable?** | No — different content always yields a different URL | Yes — the same URL, edited over time (append-only version history) |
| **Account?** | None required | Owned by an account (free tier included) |
| **Persistence** | Free, best-effort, kept **~30 days**, then garbage-collected | **Durable & guaranteed** while the account is active |
| **Best for** | Quick sharing, previews, QR codes, paste-into-chat | Anything you need to keep, keep editing, or make private |

In short: **`sha256` is a disposable snapshot; `uuid` is a durable document.**
You get the best of both by **publishing** an exact immutable version of a
durable Frame (Frame menu → **Publish version**), which mints
`framejs.app/j/<uuid>?v=<sha256>` — a stable handle *and* an unchanging snapshot.
A published version is **permanently public and citable, like a DOI**: it keeps
resolving even if you later make the Frame private or delete it, and both apps
serve it (`framejs.io/j/<uuid>?v=<sha256>` renders the same snapshot on the
runtime). See [Persistence & Data Retention](/guide/persistence) for the
complete model.

## Example

A full URL like this:

```
https://framejs.io/#?js=Y29uc3QgZGl2ID0gZG9jdW1lbnQuY3Jl...&options=eyJhdXRvcnVuIjp0cnVlfQ%3D%3D
```

Becomes:

```
https://framejs.io/j/8a3b1c9f4e2d7a6b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
```

When someone opens the short URL, the page loads with all the original code and state intact — no redirect, the browser stays on the `/j/...` path.

## API

You can also shorten URLs programmatically.

### `POST /api/shorten` — Shorten from hash params

Store raw hash params and get a short URL ID back.

```bash
curl -X POST https://framejs.io/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"hashParams": "?js=Y29uc29sZS5sb2coImhlbGxvIik%3D"}'
```

Response:

```json
{
  "success": true,
  "id": "8a3b1c9f...",
  "path": "/j/8a3b1c9f..."
}
```

### `POST /api/shorten/json` — Shorten from JSON

A convenience endpoint that encodes JavaScript and options into hash params for you.

```bash
curl -X POST https://framejs.io/api/shorten/json \
  -H "Content-Type: application/json" \
  -d '{"js": "console.log(\"hello\")"}'
```

Accepted keys are the frame's hash params: `js`, `inputs`, `modules`, `og`,
`options`, and `definition`. Any hash param the app writes itself must be
declared in `definition.hashParams` or it is dropped — `setJson` does that
for the app automatically, and `definition` carries the result. See
[URL State](/guide/url-state#what-setjson-does-for-you).

Response:

```json
{
  "id": "8a3b1c9f...",
  "shortUrl": "https://framejs.io/j/8a3b1c9f...",
  "fullUrl": "https://framejs.io/#?js=Y29uc29sZS5sb2coImhlbGxvIik%3D",
  "hashParams": "?js=Y29uc29sZS5sb2coImhlbGxvIik%3D"
}
```

### `POST /api/frame` — Create or update an editable frame

Creates a durable, editable `framejs.app/j/<uuid>` frame (anonymous until
claimed) and returns its URL. CORS is open, so a page on any origin can call it
and read the result — this is what an app's
[Open in framejs export](../ai/export-from-your-app) uses.

```bash
curl -X POST https://framejs.io/api/frame \
  -H "Content-Type: application/json" \
  -d '{"frame": {"js": "root.innerHTML = \"hello\"", "og": {"title": "Hello"}}}'
```

`frame` is the same `{js, inputs, modules, og, definition}` object
`/api/shorten/json` takes. It is stored as sent, minus params left at their
default value. Pass `"id": "<uuid>"` next to it to append a version to that
frame instead of creating a new one (allowed while the frame is unclaimed); an
`id` that is not a uuid is a `400`, never a new frame.

Response:

```json
{
  "id": "019f2916dcb17ace8876580ebd1fdcd5",
  "url": "https://framejs.app/j/019f2916dcb17ace8876580ebd1fdcd5"
}
```

### `GET /api/j/:sha256` — Retrieve decoded hash params

Returns the short URL ID and decoded hash parameters as a JSON object.

```bash
curl https://framejs.io/api/j/8a3b1c9f...
```

Response:

```json
{
  "id": "8a3b1c9f...",
  "hashParams": {
    "js": "console.log(\"hello\")"
  }
}
```

### `GET /api/j/:sha256/url` — Retrieve full URL

Returns the full URL (with hash params) as plain text.

```bash
curl https://framejs.io/api/j/8a3b1c9f.../url
```

Response:

```
https://framejs.io/#?js=Y29uc29sZS5sb2coImhlbGxvIik%3D
```

### `GET /j/:sha256/qrcode.png` — QR code image

Returns a PNG QR code that encodes the short URL `https://framejs.io/j/<sha256>`. The response has CORS open (`Access-Control-Allow-Origin: *`) and is cached immutably, so the image can be embedded directly anywhere — `<img>` tags, Markdown, slides, printed material:

```html
<img src="https://framejs.io/j/8a3b1c9f.../qrcode.png" alt="QR code" />
```

Any extra query parameters on the request are appended to the encoded URL. This lets you generate QR codes that open the short URL with additional hash/query state, for example to point at a specific tab or view:

```
https://framejs.io/j/8a3b1c9f.../qrcode.png?foo=bar
```

encodes `https://framejs.io/j/8a3b1c9f...?foo=bar`.

The encoded URL always uses the canonical `framejs.io` origin, regardless of which host served the image — so QR codes stay valid even when generated from an alias or preview domain.

### `POST /api/upload/presign` — Get presigned upload URL

Generate a presigned S3 URL for direct browser-to-storage file upload. Files are content-addressed by SHA256.

```bash
curl -X POST https://framejs.io/api/upload/presign \
  -H "Content-Type: application/json" \
  -d '{"contentType": "image/png", "sha256": "abcd1234..."}'
```

Response:

```json
{
  "presignedUrl": "https://s3.../f/abcd1234...?X-Amz-Signature=...",
  "id": "abcd1234...",
  "canonicalPath": "/f/abcd1234..."
}
```

### `GET /f/:id` — Download a file

Redirects to the public storage URL for a previously uploaded file.

```bash
curl -L https://framejs.io/f/abcd1234...
```

::: tip
Short URLs are content-addressed — the same code always produces the same short
URL. They are free and kept for about a month; for a link that lasts, save it to
a durable [Frame](/guide/persistence).
:::
