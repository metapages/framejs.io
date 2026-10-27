// Bundles a frame's ES modules (and stylesheets) into ONE self-contained file,
// for the standalone HTML export (see standalone-export.ts).
//
// The browser resolves a frame's `import "https://esm.sh/…"` over the network
// at run time. An exported page must make zero requests for its code, so every
// import is fetched here, server-side, and esbuild inlines the whole graph —
// static imports, string-literal dynamic imports, CSS @import and url() assets
// — into a single output. Import maps (the `modules` hash param can carry one)
// are applied while resolving, since the export ships no import map of its own.
//
// esbuild runs as wasm (no native binary: Deno Deploy cannot spawn one), and is
// imported lazily so it costs nothing outside the export route.

import type * as Esbuild from "https://deno.land/x/esbuild@v0.25.0/wasm.js";

/** One fetched network resource. `url` is the final URL, after redirects. */
export type FetchedAsset = {
  url: string;
  bytes: Uint8Array;
  contentType: string;
};

export type FetchAsset = (
  url: string,
  /** Refuse (413) a response larger than this many bytes. */
  options?: { maxBytes?: number },
) => Promise<FetchedAsset>;

/** The `imports` half of an import map. Scopes are not supported. */
export type ImportMapImports = Record<string, string>;

// esbuild's wasm, pinned by content. Left to itself, `initialize()` downloads
// it from deno.land/x on first use, making every export depend on that one
// host. Instead it is fetched from whichever mirror answers first in this list,
// checked against the hash (so a mirror cannot serve anything else), compiled
// once per isolate and handed over as a module.
const ESBUILD_VERSION = "0.25.0";
const ESBUILD_WASM_SHA256 =
  "92303a29c9d60620a756925939bbb0f60800fa1eed14a29f93b8a3e9394ac0b9";
const ESBUILD_WASM_MIRRORS = [
  `https://cdn.jsdelivr.net/npm/esbuild-wasm@${ESBUILD_VERSION}/esbuild.wasm`,
  `https://unpkg.com/esbuild-wasm@${ESBUILD_VERSION}/esbuild.wasm`,
  `https://deno.land/x/esbuild@v${ESBUILD_VERSION}/esbuild.wasm`,
];

const sha256Hex = async (bytes: Uint8Array) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", bytes as BufferSource),
    ),
  ).map((b) => b.toString(16).padStart(2, "0")).join("");

async function loadEsbuildWasm(): Promise<WebAssembly.Module> {
  const failures: string[] = [];
  for (const url of ESBUILD_WASM_MIRRORS) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const hash = await sha256Hex(bytes);
      if (hash !== ESBUILD_WASM_SHA256) throw new Error(`sha256 ${hash}`);
      return await WebAssembly.compile(bytes as BufferSource);
    } catch (error) {
      failures.push(
        `${url}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  throw new Error(`Could not load esbuild.wasm (${failures.join("; ")})`);
}

let _esbuild: Promise<typeof Esbuild> | undefined;
const esbuild = (): Promise<typeof Esbuild> => {
  _esbuild ??= (async () => {
    const [mod, wasmModule] = await Promise.all([
      import("https://deno.land/x/esbuild@v0.25.0/wasm.js"),
      loadEsbuildWasm(),
    ]);
    // worker:false — Deno Deploy cannot run esbuild's wasm in a Worker.
    await mod.initialize({ worker: false, wasmModule });
    return mod;
  })();
  // A failed start is not cached: the next export tries again.
  _esbuild.catch(() => (_esbuild = undefined));
  return _esbuild;
};

const HTTP_NAMESPACE = "framejs-http";

/** Resolve a bare specifier through an import map (exact, then longest prefix). */
export const resolveWithImportMap = (
  specifier: string,
  imports: ImportMapImports,
): string | undefined => {
  if (imports[specifier]) return imports[specifier];
  let best: string | undefined;
  for (const key of Object.keys(imports)) {
    if (
      key.endsWith("/") && specifier.startsWith(key) &&
      (!best || key.length > best.length)
    ) {
      best = key;
    }
  }
  return best ? imports[best] + specifier.slice(best.length) : undefined;
};

const isAbsoluteOrRelative = (s: string) =>
  /^https?:\/\//.test(s) || s.startsWith("/") || s.startsWith("./") ||
  s.startsWith("../");

// What esbuild should do with a fetched file. Anything a stylesheet references
// with url() that is not itself a stylesheet (fonts, images) becomes a data URL.
const loaderFor = (
  asset: FetchedAsset,
  fromCssUrl: boolean,
): Esbuild.Loader => {
  const type = asset.contentType.split(";")[0].trim().toLowerCase();
  const path = new URL(asset.url).pathname.toLowerCase();
  if (type === "text/css" || path.endsWith(".css")) return "css";
  if (fromCssUrl) return "dataurl";
  if (type === "application/json" || path.endsWith(".json")) return "json";
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts") || path.endsWith(".mts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  return "js";
};

export type BundleEntry =
  /** Inline source (the frame's `js`). `baseUrl` resolves its relative imports. */
  | { contents: string; baseUrl?: string }
  /** A module or stylesheet URL. */
  | { url: string };

/**
 * Bundles `entry` and everything it imports into a single ESM (or CSS) string
 * with no remaining network imports. Throws (esbuild's message) when an import
 * cannot be fetched or resolved.
 */
export async function bundle(
  entry: BundleEntry,
  options: { fetchAsset: FetchAsset; importMap?: ImportMapImports },
): Promise<{ code: string; loader: Esbuild.Loader }> {
  const { fetchAsset, importMap = {} } = options;
  const es = await esbuild();

  let contents: string;
  let entryBase: string | undefined;
  let loader: Esbuild.Loader = "js";
  if ("url" in entry) {
    const asset = await fetchAsset(entry.url);
    contents = new TextDecoder().decode(asset.bytes);
    entryBase = asset.url;
    loader = loaderFor(asset, false);
  } else {
    contents = entry.contents;
    entryBase = entry.baseUrl;
  }

  const plugin: Esbuild.Plugin = {
    name: "framejs-http",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        // Already inline: nothing to fetch.
        if (args.path.startsWith("data:")) return { external: true };
        // The importer's own URL, after redirects (set by onLoad below). The
        // entry is stdin, which has no onLoad, so it uses the entry's base.
        const base: string | undefined = args.pluginData?.base ?? entryBase;
        let specifier = args.path;
        if (!isAbsoluteOrRelative(specifier)) {
          const mapped = resolveWithImportMap(specifier, importMap);
          if (!mapped) {
            return {
              errors: [{
                text:
                  `Cannot resolve bare import "${specifier}": imports must be full https:// URLs, or mapped by an import map`,
              }],
            };
          }
          specifier = mapped;
        }
        let resolved: string;
        try {
          resolved = new URL(specifier, base).href;
        } catch {
          return {
            errors: [{
              text:
                `Cannot resolve "${args.path}": no base URL to resolve it against`,
            }],
          };
        }
        return {
          path: resolved,
          namespace: HTTP_NAMESPACE,
          pluginData: { fromCssUrl: args.kind === "url-token" },
        };
      });

      build.onLoad(
        { filter: /.*/, namespace: HTTP_NAMESPACE },
        async (args) => {
          const asset = await fetchAsset(args.path);
          return {
            contents: asset.bytes,
            loader: loaderFor(asset, !!args.pluginData?.fromCssUrl),
            pluginData: { base: asset.url },
          };
        },
      );
    },
  };

  const result = await es.build({
    stdin: { contents, loader, sourcefile: entryBase ?? "frame.js" },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "esnext",
    charset: "utf8",
    logLevel: "silent",
    plugins: [plugin],
  });
  return {
    code: result.outputFiles!.map((f) => f.text).join("\n"),
    loader,
  };
}
