// Builds what wrangler.jsonc deploys, into dist/cloudflare/:
//
//   worker/  cloudflare.ts bundled to ESM — code-split, so the routes' lazy
//            import()s stay lazy — plus the wasm binaries it imports at run
//            time (Workers cannot compile wasm from fetched bytes).
//   assets/  everything served statically by Workers Static Assets: static/
//            at the root, the built editor at editor/ and docs at docs/. The
//            same layout server.ts serves under Deno.
//
// The editor and docs must already be built (`just build` at the repo root;
// `just deploy` does both). Run from worker/:
//   deno run -A scripts/build-cloudflare.ts

import * as esbuild from "npm:esbuild@0.28.2";
import { denoPlugin } from "jsr:@deno/esbuild-plugin@1.2.1";

import {
  ESBUILD_WASM_MIRRORS,
  ESBUILD_WASM_SHA256,
} from "../src/standalone-bundle.ts";

// Pin to the @resvg/resvg-wasm version in deno.json (and RESVG_WASM_URL in
// server.ts).
const RESVG_WASM = {
  urls: ["https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"],
  sha256: "22bf6e9f9a100d972da0411a69c5ba504367fc1fa87b3b64e3f35e53926d2d70",
};

const workerDir = new URL("..", import.meta.url).pathname;
const repoDir = new URL("../..", import.meta.url).pathname;
const outDir = `${workerDir}dist/cloudflare`;
const editorDist = `${repoDir}editor/dist`;
const docsDist = `${repoDir}docs/.vitepress/dist`;

for (const [what, dir] of [["editor", editorDist], ["docs", docsDist]]) {
  if (!(await exists(`${dir}/index.html`))) {
    throw new Error(
      `${what} is not built (no ${dir}/index.html): run \`just build\` first`,
    );
  }
}

await Deno.remove(outDir, { recursive: true }).catch(() => {});
await Deno.mkdir(`${outDir}/worker`, { recursive: true });
await Deno.mkdir(`${outDir}/assets`, { recursive: true });

// --- assets: -L follows symlinks (static/llms.md is one) ---
await cp(`${workerDir}static/.`, `${outDir}/assets/`);
await cp(editorDist, `${outDir}/assets/editor`);
await cp(docsDist, `${outDir}/assets/docs`);

// --- worker bundle ---

// `import x from "./f" with { type: "text" }` (cloudflare.ts embeds its files
// so). esbuild handles these natively, but the Deno plugin claims every import
// before esbuild sees it, so this one must run first.
const textImports: esbuild.Plugin = {
  name: "text-imports",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) =>
      args.with?.type === "text"
        ? {
          path: new URL(args.path, `file://${args.resolveDir}/`).pathname,
          namespace: "text",
        }
        : undefined);
    build.onLoad({ filter: /.*/, namespace: "text" }, async (args) => ({
      contents: await Deno.readTextFile(args.path),
      loader: "text",
    }));
  },
};

const result = await esbuild.build({
  entryPoints: [`${workerDir}cloudflare.ts`],
  outdir: `${outDir}/worker`,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  conditions: ["workerd", "worker", "browser"],
  target: "es2024",
  sourcemap: "external",
  metafile: true,
  logLevel: "warning",
  plugins: [
    textImports,
    denoPlugin({ configPath: `${workerDir}deno.json` }),
  ],
});
await esbuild.stop();

// Nothing in the bundle may reach for Node's runtime: on Workers that is
// either missing or a stub. (The dependencies that did — @aws-sdk, qrcode's
// png renderer — were replaced; see src/s3.ts and src/qr-png.ts.)
const nodeImports = new Set<string>();
for (const [file, output] of Object.entries(result.metafile.outputs)) {
  for (const imp of output.imports) {
    if (imp.external && /^node:|^[a-z_]+$/.test(imp.path)) {
      nodeImports.add(`${file} → ${imp.path}`);
    }
  }
}
if (nodeImports.size) {
  throw new Error(
    `The worker bundle imports Node built-ins:\n  ${
      [...nodeImports].join("\n  ")
    }`,
  );
}

// --- wasm, downloaded and checked against its pinned hash ---
await fetchVerified(
  `${outDir}/worker/esbuild.wasm`,
  ESBUILD_WASM_MIRRORS,
  ESBUILD_WASM_SHA256,
);
await fetchVerified(
  `${outDir}/worker/resvg.wasm`,
  RESVG_WASM.urls,
  RESVG_WASM.sha256,
);

let bytes = 0;
for await (const entry of Deno.readDir(`${outDir}/worker`)) {
  if (!entry.name.endsWith(".map")) {
    bytes += (await Deno.stat(`${outDir}/worker/${entry.name}`)).size;
  }
}
console.log(
  `Built ${outDir}: worker ${(bytes / 1024 / 1024).toFixed(1)} MB ` +
    `(uncompressed, incl. wasm)`,
);

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function cp(from: string, to: string): Promise<void> {
  const { code } = await new Deno.Command("cp", { args: ["-RL", from, to] })
    .spawn().status;
  if (code !== 0) throw new Error(`cp -RL ${from} ${to} failed`);
}

async function fetchVerified(
  path: string,
  urls: string[],
  sha256: string,
): Promise<void> {
  const failures: string[] = [];
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      ).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (hash !== sha256) throw new Error(`sha256 ${hash}`);
      await Deno.writeFile(path, bytes);
      return;
    } catch (error) {
      failures.push(
        `${url}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  throw new Error(`Could not fetch ${path} (${failures.join("; ")})`);
}
