// Cloudflare Workers entry point — production framejs.io.
//
// The app is server.ts, unchanged. This file only supplies what Workers lacks
// (see src/runtime.ts): there is no filesystem, so the worker's own text files
// are embedded in the bundle, and no compiling wasm from bytes, so the wasm
// binaries are uploaded with the script. Static files (editor/, docs/,
// static/) never reach this code: Workers Static Assets serves them.
//
// Built by scripts/build-cloudflare.ts, deployed by `just deploy` (wrangler.jsonc).

import indexHtml from "./index.html" with { type: "text" };
import swJs from "./sw.js" with { type: "text" };
import cacheTestUtilsJs from "./cache-test-utils.js" with { type: "text" };
import faviconSvg from "./static/favicon.svg" with { type: "text" };

import { app } from "./server.ts";
import { runtime, type WasmName } from "./src/runtime.ts";

const files: Record<string, string> = {
  "./index.html": indexHtml,
  "./sw.js": swJs,
  "./cache-test-utils.js": cacheTestUtilsJs,
  "./static/favicon.svg": faviconSvg,
};
runtime.readTextFile = (path) =>
  path in files
    ? Promise.resolve(files[path])
    : Promise.reject(new Error(`${path} is not embedded in the worker`));

// The binaries sit beside the bundle as CompiledWasm modules (wrangler.jsonc
// `rules`), so importing one yields a WebAssembly.Module. The specifiers are
// held in a variable so that neither esbuild nor `deno check` resolves them:
// the files only exist in the build output. Imported on first use, so a cold
// isolate never compiles them.
const WASM: Record<WasmName, string> = {
  resvg: "./resvg.wasm",
  esbuild: "./esbuild.wasm",
};
runtime.loadWasm = async (name) => (await import(WASM[name])).default;

export default app;
