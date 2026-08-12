# URL State

State is stored in the URL hash. You can get and set values using the [@metapages/hash-query](https://www.npmjs.com/package/@metapages/hash-query) module:

::: danger Always use `@metapages/hash-query` — never parse the hash yourself
No regex or `split` on `location.hash`, no `new URLSearchParams(location.hash.slice(1))`, no hand-built `#?key=value` strings. Values are base64-encoded over a URI-encoded payload and the param order is canonical; the runtime, editor, shortener and frame API all agree on that encoding, and a hand-rolled version corrupts values or breaks saving.

And whenever you save URL state, the param name must also be added to [`definition.hashParams`](#declare-your-hash-params-or-they-get-stripped) — otherwise it is stripped when the app is saved, shortened, or copied.
:::

```javascript
import {
  getHashParamsFromWindow,
  getHashParamFromWindow,
  getHashParamValueJsonFromWindow,
  setHashParamValueJsonInWindow,
  setHashParamValueBase64EncodedInWindow,
  getHashParamValueBase64DecodedFromWindow,
  deleteHashParamFromWindow,
} from "https://cdn.jsdelivr.net/npm/@metapages/hash-query@0.10.0/+esm";

// Get JSON stored in URL
const myJsonBlob = getHashParamValueJsonFromWindow("someKey") || {};

// Update the JSON blob
myJsonBlob["someKey"] = "foobar";

// Set it back in the URL
setHashParamValueJsonInWindow("someKey", myJsonBlob);

// Delete it if needed
deleteHashParamFromWindow("someKey");
```

::: tip
This is designed for relatively small values. Large multi-megabyte JSON blobs are not yet supported.
:::

## Declare your hash params, or they get stripped

Writing the param is only half of it. framejs keeps a **whitelist** of hash
params, and anything outside it is removed whenever the app is **saved,
shortened, or copied as a link** — so the state silently disappears from the URL
you share.

These built-ins are always allowed: `js`, `inputs`, `modules`, `og`, `options`,
`bgColor`, `edit`, `editorWidth`, `hm`, `definition`.

Every other param name — `someKey` in the example above — must be declared in
the frame's **metaframe definition**, under `definition.hashParams`.

### In the editor

Open **Settings** (the ⚙ icon) → the **Runtime** tab → **Allowed Hash
Parameters** → **Add Hash Parameter**, and add the param name. That writes it
into the `definition` hash param for you.

![The Allowed Hash Parameters section under Settings → Runtime in the framejs editor, with its "Add Hash Parameter" button](./url-state-allowed-hash-params.png)

### In the definition JSON

The `definition` hash param holds the metaframe definition. The relevant part:

```json
{
  "version": "1",
  "hashParams": {
    "someKey": {
      "type": "json",
      "label": "Some Key",
      "description": "State the app persists in the URL"
    }
  }
}
```

`type` must match how the app encodes the value:

| `type` | Written with |
|--------|--------------|
| `json` | `setHashParamValueJsonInWindow` |
| `stringBase64` | `setHashParamValueBase64EncodedInWindow` |
| `string` | `setHashParamInWindow` |
| `number` | `setHashParamValueFloatInWindow` / `setHashParamValueIntInWindow` |
| `boolean` | `setHashParamValueBooleanInWindow` |

`label` and `description` are optional; they are only used by the editor's
settings UI.

### From the API or an AI agent

`definition` is a normal hash param, so it goes in the frame body alongside `js`
(see [Short URLs](/guide/short-urls) and the
[frame API](https://framejs.io/llms-claude-code.txt)):

```json
{
  "js": "…",
  "definition": {
    "version": "1",
    "hashParams": { "someKey": { "type": "json" } }
  }
}
```

The [framejs Agent Skill](/guide/ai) helper does this with a flag:

```bash
cat app.js | node scripts/framejs.mjs create --state "$SCRATCH/frame.json" \
  --hash-param someKey:json
```

When you update an existing frame, keep its `definition` — dropping it
un-whitelists params the app still relies on. (The helper carries the stored
definition forward automatically.)

## The `css` hash param (transient global stylesheet)

The `css` hash param loads a global stylesheet at runtime. Its value is **base64-encoded** and is either:

- raw CSS text, which is injected as a `<style>` element, or
- a URL to a CSS stylesheet (a single-line `http(s)` URL), which is injected as a `<link rel="stylesheet">`.

Unlike the other hash params, `css` is **not persisted**: it is never written into the metaframe definition, copied into shareable links, or baked into [short URLs](/guide/short-urls). It is purely appended at runtime.

This makes it ideal for applying a consistent style across many different pieces of content **without modifying that content**. Because it is not part of a short URL's content, appending `#?css=…` to an existing short URL changes nothing about the underlying content — it just layers a stylesheet on top.

The value is encoded the same way as every other base64 hash param: `btoa(encodeURIComponent(text))` (the plain `btoa` alone is not enough — non-ASCII characters would corrupt).

```javascript
// Base64-encode raw CSS...
const css = btoa(encodeURIComponent("body { background: #111; color: #eee; }"));
location.hash = "?css=" + css;

// ...or base64-encode a stylesheet URL
const css = btoa(encodeURIComponent("https://example.com/theme.css"));
location.hash = "?css=" + css;
```

Appended to a short URL: `https://framejs.io/j/<id>#?css=<base64>`

::: tip
Clearing or changing the `css` param replaces the previously injected stylesheet, so you can swap themes live by updating the param.
:::
