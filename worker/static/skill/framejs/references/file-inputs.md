# Local file inputs (framejs.io)

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
