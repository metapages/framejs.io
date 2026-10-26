# Website Integration

Put a framejs frame **straight into your own page** (blogs, docs, landing page) as native content: no iframe, no editor, no framejs.io page
loaded. The frame's code runs in your page, inside a `<div>` you place and
style, with the frame's inputs.

This is the fast path to publishing interactive content: build the chart,
simulation or tool at [framejs.app](https://framejs.app) (by hand or with AI),
then drop it into a post with one copy-paste snippet of HTML.

::: tip Just want it on the page?
An `<iframe>` of the `/j/<uuid>` URL is the simplest embed and works anywhere (
see [Embedding](../guide/embedding)). Use this page when the frame should read as
part of the page: your fonts and styles, your page's scrolling, no iframe border
or fixed-height box.
:::

## Hand this to your coding agent

Paste this into Claude Code, Cursor, Codex or any coding agent, working in your
site's repo. Fill in the two `<…>` lines; the linked file has everything else
the agent needs.

```text
Render this framejs frame directly in a page of this
site, as part of the page: no iframe, no framejs editor.

Follow exactly:
https://framejs.io/skill/framejs/references/website-integration.md

The frame: https://framejs.app/j/<uuid>
Where it goes: <e.g. in the blog post content/posts/my-post.md,
after the second paragraph / a new page at /demo>
Live or frozen: <live — show the frame's latest version /
frozen — save the frame's JSON in the site>

When you are done, serve the site, open the page and
confirm the frame draws with no console errors.
```

Agents with the [framejs skill](../ai/agent-skill) installed already know this
recipe; the prompt still tells them what you want and where.

## The minimum HTML

A frame is just JSON — the code (`js`), its data (`inputs`) and any stylesheets
or scripts it loads (`modules`) — and `https://framejs.io/j/<uuid>.json` returns
it to any page (CORS is open). This snippet is all it takes to run one: it gives
the code the few globals frame code uses (`root`, `getJson` / `setJson`,
`setOutput`), loads the modules, imports the code and hands it its inputs.

Paste it where the frame should appear and put your frame's id in the last line:

```html
<div id="root" style="width: 100%; height: 500px"></div>
<script type="module">
// Run a framejs frame ({ js, inputs, modules, ... }) in `root`: no iframe,
// no editor. `frame` is the frame object, or a URL to its JSON.
async function runFrame(frame, root) {
  if (typeof frame === "string") {
    const res = await fetch(frame);
    if (!res.ok) {
      throw new Error(`framejs: could not load ${frame} (HTTP ${res.status})`);
    }
    frame = await res.json();
  }
  if (typeof frame.js !== "string") throw new Error("framejs: frame has no js");

  // Stylesheets and scripts the code expects to be loaded before it runs
  for (const entry of frame.modules ?? []) {
    const url = entry.trim();
    if (!/^https?:\/\//.test(url)) {
      console.warn(
        "framejs: skipped, add it to the page <head> yourself:",
        url,
      );
      continue;
    }
    await new Promise((resolve, reject) => {
      const el = url.endsWith(".css")
        ? Object.assign(document.createElement("link"), {
          rel: "stylesheet",
          href: url,
        })
        : Object.assign(document.createElement("script"), { src: url });
      el.onload = resolve;
      el.onerror = () => reject(new Error(`framejs: failed to load ${url}`));
      document.head.append(el);
    });
  }

  // The globals frame code uses. URL state (getJson/setJson) starts from the
  // frame's saved values and stays in memory: this page's URL is untouched.
  // Outputs are dispatched on `root` as a "framejs-outputs" event.
  const state = { ...frame };
  const setOutputs = (outputs) =>
    root.dispatchEvent(new CustomEvent("framejs-outputs", { detail: outputs }));
  Object.assign(globalThis, {
    root,
    getJson: (key) => state[key],
    setJson: (key, value) => {
      state[key] = value;
    },
    saveJson: (key, value) => {
      state[key] = value;
    },
    setOutputs,
    setOutput: (key, value) => setOutputs({ [key]: value }),
    log: console.log,
    logStdout: console.log,
    logStderr: console.error,
  });

  // `js` is the module source, or a URL to it
  let js = frame.js;
  if (/^https?:\/\/\S+$/.test(js.trim())) {
    js = await (await fetch(js.trim())).text();
  }
  const src = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
  const code = await import(src);
  URL.revokeObjectURL(src);

  // Inputs like { type: "url", value } are fetched first, as framejs does
  const fetchInput = async (key, value) => {
    if (value?.type !== "url") return value;
    const res = await fetch(value.value);
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("json") || key.endsWith(".json")) return res.json();
    return type.startsWith("text/") ? res.text() : res.blob();
  };
  const setInputs = async (inputs) => {
    const entries = Object.entries(inputs ?? {});
    const resolved = await Promise.all(
      entries.map(async ([k, v]) => [k, await fetchInput(k, v)]),
    );
    code.onInputs?.(Object.fromEntries(resolved));
  };
  if (frame.inputs) await setInputs(frame.inputs);

  if (code.onResize) {
    new ResizeObserver(([entry]) =>
      code.onResize(entry.contentRect.width, entry.contentRect.height)
    ).observe(root);
  }
  return { setInputs };
}

const root = document.getElementById("root");
runFrame("https://framejs.io/j/<uuid>.json", root).catch((error) => {
  console.error(error);
  root.textContent = error.message;
});
</script>
```

That's the whole integration — no package to install, no build step. Works in
any page that can hold raw HTML: a static site, a Markdown blog that allows
HTML, a CMS "custom HTML" block.

## Live or frozen

The last line decides where the frame comes from:

| `runFrame(…)` argument                          | What readers see                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `"https://framejs.io/j/<uuid>.json"`            | **Live**: the frame's latest version — edit it, the page updates        |
| `"https://framejs.io/j/<uuid>.json?v=<sha256>"` | **Pinned**: one published version, never changes                        |
| `"./frame.json"`                                | **Frozen**: a copy saved next to the page; nothing fetched from framejs |
| `{ js, inputs }`                                | **Inline**: a frame object the page or its build writes                 |

To freeze a frame, save its JSON once and commit it with the page:

```bash
curl -o frame.json https://framejs.io/j/<uuid>.json
```

Use `framejs.io` in these URLs: its `.json` route is the CORS-open one.

## Your data, and outputs

`runFrame` resolves to `{ setInputs }`, so the page can feed the frame its own
data instead of (or after) the saved inputs:

```js
const frame = await runFrame("https://framejs.io/j/<uuid>.json", root);
frame.setInputs({ "data.json": [1, 2, 3] });
```

If the frame sends outputs, they arrive as an event on the root element:

```js
root.addEventListener("framejs-outputs", (e) => console.log(e.detail));
```

## Good to know

- **One frame per page.** Frame code shares the page's globals, so two frames on
  one page overwrite each other. Iframe any extra frames.
- **Give the `<div>` a height.** Frames fill `root`; a zero-height `<div>` shows
  nothing for most charts and canvases.
- **Keep the id `root`** unless your page already uses it (React and Vue apps
  often do); frame code may look it up with `document.getElementById("root")`.
- **URL state** saved by the frame (`setJson`) is read back by `getJson`, but
  changes stay in memory: your page's URL is never touched.
- **Styles mix.** The frame's CSS and your page's apply to each other — usually
  what you want for a blog, occasionally a surprise.
- **CSP.** If your site sets a Content-Security-Policy, allow `blob:` and the
  frame's CDN hosts in `script-src`.
- **Import maps** in a frame's `modules` have to be copied into a
  `<script type="importmap">` in your page's `<head>`, and so do modules written
  as `<link …>` / `<script …>` tags; the snippet skips them with a console
  warning.
- **If the frame can't load** (wrong id, private or deleted frame), the error —
  with the URL and HTTP status — is written into the `<div>` and the console.
- **Not covered:** the legacy `handleResize` export (use `onResize`), and input
  references other than `{ "type": "url" }`, which reach `onInputs` as-is.

## Reference

- [`website-integration.md`](https://framejs.io/skill/framejs/references/website-integration.md)
  — the full recipe the prompt points at.
- [JavaScript API](../guide/javascript-api) — the globals and exports frame code
  uses, which the snippet provides.
- [Rendering in a Website](../guide/rendering) — the iframe-based alternative
  with full metapage input/output wiring.
