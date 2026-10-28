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

Deno.test("keeps literal constants the functions read", async () => {
  const { code } = extractModule(`
const SCALE = 10;
const NAMES = ["a", "b"];
const CONFIG = { unit: "px", neg: -1, fmt: (v) => v + "px" };
const computed = Math.random();
export const scale = (x) => x * SCALE + NAMES.length + CONFIG.neg;
`);
  assertEquals(code.includes("Math.random"), false);
  const mod = await importModule(code);
  assertEquals(mod.scale(2), 21);
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

Deno.test("keeps binding imports and re-exports, drops side-effect imports", () => {
  const { code } = extractModule(`
import "https://esm.sh/some-polyfill";
import * as d3 from "https://esm.sh/d3@7";
import { x } from "https://esm.sh/x";
export * from "https://esm.sh/y";
export { z } from "https://esm.sh/z";
export const f = () => d3.max([x]);
`);
  assertEquals(code.includes("some-polyfill"), false);
  for (
    const kept of [
      'import * as d3 from "https://esm.sh/d3@7";',
      'import { x } from "https://esm.sh/x";',
      'export * from "https://esm.sh/y";',
      'export { z } from "https://esm.sh/z";',
    ]
  ) {
    assertEquals(code.includes(kept), true, kept);
  }
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
