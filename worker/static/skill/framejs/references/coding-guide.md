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
