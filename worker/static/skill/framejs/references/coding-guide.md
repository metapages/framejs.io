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
- ❌ Rendering generated/fetched data directly instead of seeding it through
  `onInputs` on the last line — see "Generated data MUST be fed through
  `onInputs`".

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
