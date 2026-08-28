# Browser JavaScript coding guide (framejs.io)

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
- **Keep the top-right corner clear** — the runtime's Edit button is overlaid
  there. See "Reserved area" below.

## Reserved area: the Edit button (top-right corner)

The runtime overlays its own **Edit** button in the top-right corner of the
frame, painted above your content (`z-index: 1000`). It is usually invisible
until hover, so it will not be obvious while you write the code — but a click in
that area hits the Edit button, not your UI.

Exact footprint, measured from the top-right corner of the viewport:

| Viewport               | Button size | Offsets              | Occupied box                     |
| ---------------------- | ----------- | -------------------- | -------------------------------- |
| wider than 768px       | 80 × 30 px  | 10px top, 10px right | top 0–40 px, right edge 0–90 px  |
| 768px or less (mobile) | 120 × 52 px | 8px top, 12px right  | top 0–60 px, right edge 0–132 px |

**Rule: treat the top-right `140 × 64` px of the frame as off-limits.** That
covers both breakpoints plus a margin. Never place a button, menu, toolbar,
legend, close/fullscreen icon, dropdown, or any other clickable or important
element in it.

Put controls top-left, along the bottom, or — when they must sit on the top row
— inset them at least 140px from the right edge:

```js
root.innerHTML = `<div style="width:100%;height:100%;position:relative">
  <!-- control bar stops 148px short of the right edge -->
  <div style="position:absolute;top:8px;left:8px;right:148px;z-index:1">
    <button>Play</button><button>Reset</button>
  </div>
  <div id="chart" style="width:100%;height:100%"></div>
</div>`;
```

Full-bleed content (a chart, a canvas, a 3D scene) may extend under the reserved
area — only interactive or must-read elements need to stay out of it.

## Pre-defined globals (no import needed)

```js
setOutput("outputName", value); // send one output
setOutputs({ out1: "val", out2: 42 }); // send multiple outputs
log("message"); // visual log — writes to the display
logStdout("message"); // stdout log
logStderr("error"); // stderr log
getJson("state"); // read state saved in the URL (undefined if none)
setJson("state", { zoom: 2 }); // save state into the URL — see below
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

## Generated data MUST be fed through `onInputs`

Whenever the app produces its own data — random/simulated values, a hard-coded
sample dataset, a computed series, or a `fetch()` from an API — you MUST NOT
render it directly. Route it through `onInputs` so that generated data and
external data take the exact same path. Later, real data can be attached to the
frame as an input and the app keeps working with **zero code changes**: the
runtime calls `onInputs` the same way, so the only edit is deleting the seed
call.

Three rules, always applied together:

1. **All rendering that responds to data happens in `onInputs(inputs)`**,
   reading the data from `inputs[<key>]` — never from a generator's return value
   directly. Rendering driven by anything other than data — user interaction,
   animation frames, `onResize` — stays in its own handler; it must not move
   into `onInputs`, and event listeners must be bound once (in the module body),
   not re-bound on every `onInputs` call.
2. **Data generation or gathering lives in its own dedicated function** that
   only returns the data — no DOM, no rendering, no side effects. This keeps the
   generated-data block trivial to find and replace.
3. **The LAST statement of the module calls `onInputs`** with that data, under
   the key that external data would arrive with.

```js
const INPUT_KEY = "data.json"; // the key external data would arrive under

root.innerHTML = `<div id="chart" style="width:100%;height:100%"></div>`;

// (2) data generation, isolated — returns data, renders nothing
function generateData() {
  return Array.from({ length: 50 }, (_, i) => ({ x: i, y: Math.sin(i / 5) }));
}

// (1) the single render path — identical for generated and external data
export function onInputs(inputs) {
  const data = inputs?.[INPUT_KEY];
  if (!data) return;
  renderChart(data);
}

// (3) LAST line: seed the app with the generated data via the same entry point
onInputs({ [INPUT_KEY]: generateData() });
```

- Interaction, animation, and resize handlers keep their own render calls — they
  just read the latest data from a module-level variable that `onInputs`
  updates, so they work identically for generated and external data:

  ```js
  let currentData = null;
  export function onInputs(inputs) {
    currentData = inputs?.[INPUT_KEY] ?? currentData;
    renderChart(currentData);
  }
  // bound ONCE, in the module body — never re-bound inside onInputs
  chartEl.addEventListener("click", (e) => highlight(currentData, e));
  export function onResize() {
    renderChart(currentData);
  }
  ```

- Async generation or fetching: top-level `await` is supported, so the seed line
  becomes `onInputs({ [INPUT_KEY]: await fetchData() })`.
- Multiple datasets: use one key and one generator function per dataset, and
  seed them in a single call —
  `onInputs({ "series.json": generateSeries(), "config.json": defaultConfig() })`.
- Name keys the way a real input would be named (`data.json`, `series.csv`), and
  declare each key in a constant at the top so swapping to external data is
  obvious.
- If external inputs are already attached to the frame, the runtime calls
  `onInputs` with them right after the module loads, so real data replaces the
  seeded data.
- ❌ `renderChart(generateData())` — bypasses `onInputs`; external data can
  never be swapped in.
- ❌ Generating the data _inside_ `onInputs` (e.g. `inputs.data ?? generate()`)
  — mixes the two paths and hides what must be replaced.
- ❌ Moving click/keyboard/animation handling into `onInputs`, or binding
  listeners there — only the data-driven render belongs in `onInputs`.
- This does not apply to apps with no data at all (pure animation, a
  self-contained interactive tool).

## Key details

- No need to wait for `DOMContentLoaded` — code runs after the page loads.
- `setOutput` is fire-and-forget (async, no return value).
- Prevent scroll propagation to the parent page when needed:

  ```js
  window.addEventListener("wheel", (e) => {
    if (myDiv.contains(e.target)) e.preventDefault();
  }, { passive: false });
  ```

- Persist state in the URL with the globals `getJson(key)` /
  `setJson(key, value)` — see the next section.

## Persisting state in the URL

An app can save its own state (zoom, selection, a checklist, form values) into
the URL, so the link the user copies carries the state with it.

Two globals do this. They are part of the core API — always available, nothing
to import:

```js
const state = getJson("state") || { zoom: 1 }; // undefined if never saved
setJson("state", { ...state, zoom: 2 }); // store it
setJson("state", undefined); // clear it
```

`saveJson(key, value)` is an alias of `setJson(key, value)` — prefer `setJson`
in new code; frames written against the older name keep working.

`setJson` also whitelists the key for you (it declares it in the frame's
`definition.hashParams` on first write), so the value survives being saved,
shortened, or copied as a link. **There is no second step** — do not ask the
user to add anything under Settings, and do not send a `definition` when
creating the frame just for this.

**NEVER parse or build hash params yourself** — no `location.hash.split`, no
regex on the hash, no `new URLSearchParams(location.hash.slice(1))`, no
hand-assembled `#?key=value` strings, and no `localStorage`. The encoding
(base64 of a URI-encoded JSON payload, param ordering, the `?` after `#`) is
exactly what the runtime, the editor, the shortener and the frame API expect; a
hand-rolled version corrupts values and breaks saving.

Keys are per-frame and free-form, except the reserved built-ins, which `setJson`
rejects: `js`, `inputs`, `modules`, `og`, `options`, `bgColor`, `edit`,
`editorWidth`, `hm`, `definition`, `css`.

**Writing your own state does NOT re-run your app.** The frame's source lives in
the same URL, so the runtime re-executes the app when the URL changes — but it
skips that for the app's own writes (it already has the value, and re-running
would drop the DOM and all in-memory state). So a slider can call `setJson` on
every input event without reloading itself. Own writes are still announced, so
the frame is saved as a new version. A change from _outside_ the frame — the
address bar, an embedder rewriting the url — does re-run the app, as before. To
react to those in place instead, listen for `hashchange` and re-read with
`getJson`.

When **modifying** an existing frame, `fetch` it first and pass its existing
`definition` back through unchanged — dropping it un-whitelists params the app
already relies on.

## Common mistakes

- ❌ Creating an HTML file — never create HTML files.
- ❌ Writing a local `.js` file — never write files.
- ❌ `function onInputs(inputs) {}` — not exported.
- ❌ `root.appendChild(el)` before clearing — clear `root.innerHTML` first.
- ❌ Including `"use strict"` — added automatically.
- ❌ Changing `root.style.position` / `height` / `width`.
- ❌ Writing a Node.js script — this runs in the BROWSER.
- ❌ Putting a button, menu, or toolbar in the top-right corner — it collides
  with the runtime's Edit button. Keep the top-right `140 × 64` px clear.
- ❌ Rendering generated/fetched data directly instead of seeding it through
  `onInputs` on the last line — see "Generated data MUST be fed through
  `onInputs`".
- ❌ Importing `@metapages/hash-query`, or reading/writing the hash by hand —
  `location.hash.split("&")`, a regex on `location.hash`,
  `new URLSearchParams(location.hash.slice(1))`, or building a `#?key=value`
  string. Use `getJson` / `setJson` for state, always.
- ❌ Using `localStorage` to remember state — it does not travel with the link.
  Use `setJson`.
- ❌ Declaring the param in `definition.hashParams`, or telling the user to add
  it under Settings, when the app uses `setJson` — it whitelists its own keys.
- ❌ Avoiding `setJson` to stop the frame reloading on every write. That
  workaround is obsolete — the runtime does not re-run the app for its own
  writes. Just call it.

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
