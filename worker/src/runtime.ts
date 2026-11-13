// The few things the worker needs from its host that differ between Deno (the
// local docker stack, `deno run server.ts`) and Cloudflare Workers (production,
// `cloudflare.ts`). Everything else in the worker is plain web-platform code
// and runs unchanged on both.
//
// Defaults are Deno's. The Cloudflare entry point (cloudflare.ts) overrides
// `runtime` before serving its first request; nothing here is used at module
// load. `env()` needs no override, and IS used at module load.

type ProcessEnv = { process?: { env?: Record<string, string | undefined> } };

/**
 * An environment variable. Deno reads its environment through `Deno.env`;
 * Workers (with the `nodejs_compat` flag) expose vars and secrets as
 * `process.env`, populated before any module is evaluated.
 */
export function env(name: string): string | undefined {
  if (typeof Deno !== "undefined") return Deno.env.get(name);
  return (globalThis as ProcessEnv).process?.env?.[name];
}

/** A precompiled wasm binary the worker ships with. */
export type WasmName = "resvg" | "esbuild";

export const runtime: {
  /**
   * Read one of the worker's own text files (index.html, sw.js, ...) by its
   * path relative to worker/. Deno reads the disk; Workers has no filesystem,
   * so the Cloudflare entry embeds the files in the bundle and serves them
   * from memory.
   */
  readTextFile: (path: string) => Promise<string>;
  /**
   * A precompiled wasm module, or undefined to fetch and compile it at run
   * time. Workers forbids compiling wasm from bytes (no runtime code
   * generation), so there the binaries are uploaded with the script and only
   * imported here; Deno fetches them on first use.
   */
  loadWasm: (name: WasmName) => Promise<WebAssembly.Module | undefined>;
} = {
  readTextFile: (path) => Deno.readTextFile(path),
  loadWasm: () => Promise.resolve(undefined),
};
