# Render a framejs frame directly in an existing website

Use this when the user wants a framejs frame's content to be **part of their own
page** (a blog post, a docs page, a landing page) rather than an embedded
framejs.io page: no iframe, no editor, no metaframe wiring. The frame's code
runs in the host page, inside a `<div>` the page controls, with the frame's
inputs. You are editing the user's site, not writing a frame.

If the user only wants the frame to show up and does not care how, an iframe of
the `/j/<uuid>` URL is simpler (see the Embedding guide). Use this recipe when
the frame should read as native page content: page styles and fonts, page
scrolling, no iframe border or fixed height, no framejs.io page loaded.

## What a frame is

`GET https://framejs.io/j/<uuid>.json` (CORS open) returns the frame:

```json
{ "js": "...", "inputs": {}, "modules": [], "og": {}, "definition": {} }
```

- `js` is an ES module, or occasionally a URL to the module source. It draws
  into a global `root` element and may `export` `onInputs(inputs)` and
  `onResize(width, height)`.
- `inputs` is the data handed to `onInputs`. A value
  `{ "type": "url", "value": "https://…" }` is a reference: fetch it first.
- `modules` is a list of stylesheet / script URLs the code expects loaded before
  it runs (an entry starting with `{` is an import map).
- Any other key (e.g. `state`) is URL state the frame saved with `setJson`; the
  code reads it back with `getJson(key)`.

The template below supplies exactly those globals (`root`, `getJson`, `setJson`,
`saveJson`, `setOutput`, `setOutputs`, `log`, `logStdout`, `logStderr`), loads
`modules`, imports `js`, then calls `onInputs` and `onResize`.

## The template

Copy it verbatim; change only the last line (where the frame comes from) and the
`<div>`'s size and placement.

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

## Where the frame comes from (the last line)

Pick one, and say which in your summary:

- **Live** — `runFrame("https://framejs.io/j/<uuid>.json", …)`. The page always
  shows the frame's latest saved version: edit the frame at framejs.app and the
  page updates with no deploy. Use `framejs.io` here, not `framejs.app`:
  framejs.io's `.json` route is the CORS-open one. To stop the page changing
  under its readers, pin one published version: `…/j/<uuid>.json?v=<sha256>`.
- **Frozen in the site** — download the JSON once
  (`curl -o frame.json https://framejs.io/j/<uuid>.json`), commit it next to the
  page and call `runFrame("./frame.json", …)`. Nothing is fetched from framejs
  at runtime (CDN imports inside `js` still are). Best for a published post that
  must not change.
- **Inline** — `runFrame({ js, inputs }, …)` with the object written in the
  page, for small frames or frames the site's build generates. Put `js` in a
  string the site's tooling escapes for you (JSON, not a hand-written template
  literal: backticks and a literal closing script tag in the code break it).

The user can also pass their own data instead of the frame's saved inputs:
`runFrame({ ...frame, inputs: { "data.json": myData } }, root)`, or later with
the returned `setInputs(...)`.

## Rules

- **Do not** load the framejs.io runtime page, `@metapages/metapage`, or the
  editor. This recipe exists to avoid them.
- **One frame per page.** Frame code uses page globals (`root`, `setJson`, …),
  so two frames on one page overwrite each other. For several frames on one
  page, iframe the others.
- **Keep the `<div>` id `root`** unless the page already has a `#root` (React
  and Vue apps often do). Frame code may call `document.getElementById("root")`,
  so if you must rename it, check the frame's `js` does not.
- **Give the `<div>` a size.** Frames are written to fill `root`; a `<div>` with
  no height renders nothing for most canvas / chart frames.
- **Import maps** (a `modules` entry starting with `{`) cannot be added after
  the page has started loading modules: copy the JSON into a
  `<script type="importmap">` in the page head, before any module script.
  `modules` entries written as tag strings (`<link …>`, `<script …>`) are
  skipped too: add those tags to the page head as they are.
- **Not supported:** the legacy `handleResize` export (use `onResize`), and
  input refs other than `{ "type": "url" }` (e.g. `base64`, `key`, or
  `data:text/x-uri,…` data URLs), which reach `onInputs` unchanged.
- **Errors:** a failed frame fetch (wrong uuid, private or deleted frame)
  rejects with the URL and HTTP status; the template's last line logs it and
  writes it into the `<div>`. Keep that `.catch` so a broken embed explains
  itself.
- **Content-Security-Policy:** the code is imported from a `blob:` URL, and the
  frame's own CDN imports need their hosts allowed. If the site sets a CSP, add
  `blob:` and those hosts to `script-src`.
- **Frame CSS is page CSS.** The frame's styles and the page's apply to each
  other. If the frame styles bare elements (`body`, `canvas`, `h1`), scope them
  under `#root` or tell the user.
- **Outputs** (if the frame sends any) arrive as a `framejs-outputs` event on
  the root element:
  `root.addEventListener("framejs-outputs", (e) => console.log(e.detail))`.

## Test it

Serve the page the way the site is served (not `file://`: module imports and
`fetch` need http), open it, and confirm the frame draws in the `<div>` with the
same content as `https://framejs.app/j/<uuid>`, with no errors in the console.
