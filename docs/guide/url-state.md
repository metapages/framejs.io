# URL State

State is stored in the URL hash. You can get and set values using the [@metapages/hash-query](https://www.npmjs.com/package/@metapages/hash-query) module:

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

## Declare your custom params

A param name you invent — `someKey` above — must be declared in the frame's `definition.hashParams`, under **Settings** (`⚙`) → **Runtime** → **Allowed Hash Parameters**, or via the `definition` hash param:

```json
{
  "version": "1",
  "hashParams": {
    "someKey": { "type": "json", "label": "Some key", "description": "…" }
  }
}
```

Undeclared params are stripped when the editor shortens or copies the app as a link, so the link you share loses the state. The built-in params (`js`, `inputs`, `modules`, `og`, `options`, `bgColor`, `edit`, `editorWidth`, `hm`, `definition`) are always allowed.

`type` describes the encoding: `json` for `setHashParamValueJsonInWindow`, `stringBase64` for base64 strings, otherwise `string` / `boolean` / `number`.

## Writing state does not re-run your app

A frame's own source lives in the URL hash, so the runtime re-executes the app whenever the hash changes. It makes one exception: **changes the app itself writes.** The app already holds the value it just wrote, and re-running would throw away the DOM and every bit of in-memory state — so a slider bound to `setHashParamValueJsonInWindow` can write on every input event without reloading itself.

Those writes are still announced, so an app opened from [framejs.app](https://framejs.app) saves them as a new version. This holds however the URL is written — `setHashParamValueJsonInWindow`, or a bare `history.replaceState` — though you should always use the helpers, because they are what get the encoding right.

A change from **outside** the frame — editing the address bar, an embedder rewriting the url — still re-runs the app, so it picks up the new state on the next run. To handle those in place instead, listen for `hashchange`:

```javascript
window.addEventListener("hashchange", () => {
  const next = getHashParamValueJsonFromWindow("someKey") || {};
  // reconcile against what is already applied, then update the UI
});
```

::: tip
That listener also fires for your own writes. Compare against the state you last applied and ignore anything already reflected in the UI, so a write can't cause a render loop.
:::

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
