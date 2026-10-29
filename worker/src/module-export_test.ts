import { assertEquals, assertThrows } from "@std/assert";
import { extractModule, ModuleExportError } from "./module-export.ts";

// Evaluates a module source the way an importer would (a data: URL import).
const importModule = (code: string) =>
  import(`data:text/javascript;base64,${btoa(code)}`);

Deno.test("keeps exported and helper functions, drops top-level code", async () => {
  const source = `
const el = document.createElement("div");
root.appendChild(el);
function helper(x) { return x * 2; }
export function double(x) { return helper(x); }
export const triple = (x) => x * 3;
export async function later(x) { return x; }
console.log("ran");
`;
  const { code, skipped } = extractModule(source);
  assertEquals(skipped, []);
  assertEquals(code.includes("document"), false);
  assertEquals(code.includes("console.log"), false);
  // Importing it must not touch `document`/`root` (neither exists in Deno).
  const mod = await importModule(code);
  assertEquals(mod.double(4), 8);
  assertEquals(mod.triple(2), 6);
  assertEquals(await mod.later(5), 5);
});

Deno.test("keeps const primitives the functions read", async () => {
  const { code } = extractModule(`
const SCALE = 10;
const UNIT = \`px\`;
const NEG = -1;
const computed = Math.random();
export const scale = (x) => x * SCALE + NEG + UNIT;
`);
  assertEquals(code.includes("Math.random"), false);
  const mod = await importModule(code);
  assertEquals(mod.scale(2), "19px");
});

// Top-level code that would change these is dropped, so keeping them would
// hand a function a value the frame never had. Dropped instead, a read throws.
Deno.test("let/var and const objects are dropped, not kept stale", async () => {
  const { code, skipped } = extractModule(`
let count = 0; count = 5;
var v = 1;
const cfg = {}; cfg.unit = "px";
const list = [1]; list.push(2);
export let exportedLet = 1;
export const get = () => count;
export const u = () => cfg.unit;
export const n = () => list.length;
export const w = () => v;
`);
  assertEquals(skipped, ["exportedLet"]);
  for (const name of ["count", "cfg", "list", "var v"]) {
    assertEquals(code.includes(`${name} =`), false, name);
  }
  const mod = await importModule(code);
  for (const f of [mod.get, mod.u, mod.n, mod.w]) {
    assertThrows(() => f(), ReferenceError);
  }
});

Deno.test("a function reassigned at top level is dropped", async () => {
  const { code, skipped } = extractModule(`
export function f() { return 1; }
f = () => 2;
function helper() { return 1; }
if (true) helper = () => 2;
export const g = () => helper();
`);
  assertEquals(skipped, ["f"]);
  const mod = await importModule(code);
  assertEquals("f" in mod, false);
  assertThrows(() => mod.g(), ReferenceError);
});

Deno.test("reports exports that are not functions", () => {
  const { code, skipped } = extractModule(`
export const data = await fetch("x");
export const ok = () => 1, bad = compute();
export class Widget {}
const local = makeThing();
export { local as thing };
export default root;
`);
  assertEquals(
    skipped.sort(),
    ["bad", "data", "default", "thing", "Widget"].sort(),
  );
  assertEquals(code.trim(), "export const ok = () => 1;");
});

Deno.test("export lists and default exports of kept bindings", async () => {
  const { code, skipped } = extractModule(`
export { a, b as bee };
export default a;
function a() { return "a"; }
const b = function () { return "b"; };
`);
  assertEquals(skipped, []);
  const mod = await importModule(code);
  assertEquals(mod.a(), "a");
  assertEquals(mod.bee(), "b");
  assertEquals(mod.default(), "a");
});

Deno.test("keeps used imports and re-exports, drops the rest", () => {
  const { code } = extractModule(`
import "https://esm.sh/some-polyfill";
import * as d3 from "https://esm.sh/d3@7";
import { x, unusedName } from "https://esm.sh/x";
import def, { y as why } from "https://esm.sh/y" with { type: "json" };
import { max } from "d3";
export * from "https://esm.sh/w";
export { z } from "https://esm.sh/z";
export const f = () => d3.max([x, why, def]);
`);
  for (
    const dropped of ["some-polyfill", "unusedName", '"d3"', "max }"]
  ) {
    assertEquals(code.includes(dropped), false, dropped);
  }
  for (
    const kept of [
      'import * as d3 from "https://esm.sh/d3@7";',
      'import { x } from "https://esm.sh/x";',
      'import def, { y as why } from "https://esm.sh/y" with { type: "json" };',
      'export * from "https://esm.sh/w";',
      'export { z } from "https://esm.sh/z";',
    ]
  ) {
    assertEquals(code.includes(kept), true, kept);
  }
});

Deno.test("an import used only through export { … } is kept", () => {
  const { code } = extractModule(`
import { helper } from "https://esm.sh/h";
export { helper };
`);
  assertEquals(
    code.includes('import { helper } from "https://esm.sh/h";'),
    true,
  );
});

// An unresolvable bare import must not break the functions that never use it.
Deno.test("a module with an unused bare import still loads", async () => {
  const { code } = extractModule(`
import { max } from "d3";
export const total = (xs) => xs.reduce((a, b) => a + b, 0);
`);
  assertEquals((await importModule(code)).total([1, 2, 3]), 6);
});

Deno.test("keeps the comments directly above a kept statement", () => {
  const { code } = extractModule(`// file header
root.innerHTML = "x"; // trailing note
/** Doubles x. */
export function double(x) { return x * 2; }
`);
  assertEquals(
    code.includes("/** Doubles x. */\nexport function double"),
    true,
  );
  assertEquals(code.includes("trailing note"), false);
  assertEquals(code.includes("file header"), false);
});

Deno.test("anonymous default function export", async () => {
  const { code } = extractModule(
    `export default function (x) { return x + 1; }`,
  );
  assertEquals((await importModule(code)).default(1), 2);
});

Deno.test("code with nothing exportable is an empty module", async () => {
  const { code } = extractModule(`root.innerHTML = "<h1>hi</h1>";`);
  assertEquals(code.trim(), "");
  assertEquals(Object.keys(await importModule(code)), []);
});

Deno.test("unparseable code throws ModuleExportError", () => {
  assertThrows(() => extractModule("export function ("), ModuleExportError);
});
