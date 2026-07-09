// Generate all raster favicons / app icons from static/favicon.svg.
//
// The SVG source uses CSS custom properties (`var(--bg)`, `var(--accent)`) and a
// `prefers-color-scheme` media query, neither of which resvg resolves. We flatten
// those to the light-theme values before rendering so the geometry stays sourced
// from favicon.svg while the colors are concrete.
//
// Run via `just generate-favicons` (from worker/). Outputs land in static/.
import { initWasm, Resvg } from "@resvg/resvg-wasm";

// Pin to the version imported by the app (see server.ts / deno.json).
const RESVG_WASM_URL =
  "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

// Light-theme colors from favicon.svg's :root block.
const BG = "#fbfaf7";
const ACCENT = "#1f2edb";

const STATIC_DIR = new URL("../static/", import.meta.url);
const SVG_PATH = new URL("favicon.svg", STATIC_DIR);

/** PNGs to emit: output filename → pixel size (square). */
const PNGS: Record<string, number> = {
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
  "favicon-48x48.png": 48,
  "favicon-96x96.png": 96,
  "apple-touch-icon.png": 180,
  "android-chrome-192x192.png": 192,
  "android-chrome-512x512.png": 512,
  "mstile-150x150.png": 150,
};

// Sizes packed into the multi-resolution favicon.ico.
const ICO_SIZES = [16, 32, 48];

/** Flatten CSS vars + drop the <style>/media-query block resvg can't handle. */
function flattenSvg(svg: string): string {
  return svg
    .replace(/<style>[\s\S]*?<\/style>/i, "")
    .replaceAll("var(--bg)", BG)
    .replaceAll("var(--accent)", ACCENT);
}

function renderPng(svg: string, size: number): Uint8Array {
  return new Resvg(svg, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng();
}

/** Pack PNG images into a Vista+ ICO (PNG-in-ICO, supported by all modern UAs). */
function buildIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const HEADER = 6;
  const ENTRY = 16;
  const dataOffset = HEADER + ENTRY * images.length;
  const totalData = images.reduce((n, i) => n + i.png.length, 0);
  const buf = new Uint8Array(dataOffset + totalData);
  const view = new DataView(buf.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, images.length, true); // image count

  let entryPos = HEADER;
  let imgPos = dataOffset;
  for (const { size, png } of images) {
    view.setUint8(entryPos + 0, size >= 256 ? 0 : size); // width (0 => 256)
    view.setUint8(entryPos + 1, size >= 256 ? 0 : size); // height
    view.setUint8(entryPos + 2, 0); // palette color count
    view.setUint8(entryPos + 3, 0); // reserved
    view.setUint16(entryPos + 4, 1, true); // color planes
    view.setUint16(entryPos + 6, 32, true); // bits per pixel
    view.setUint32(entryPos + 8, png.length, true); // size of image data
    view.setUint32(entryPos + 12, imgPos, true); // offset of image data
    buf.set(png, imgPos);
    entryPos += ENTRY;
    imgPos += png.length;
  }
  return buf;
}

const webmanifest = {
  name: "framejs.io",
  short_name: "framejs.io",
  icons: [
    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
  ],
  theme_color: ACCENT,
  background_color: BG,
  display: "standalone",
};

async function main() {
  await initWasm(fetch(RESVG_WASM_URL));

  const rawSvg = await Deno.readTextFile(SVG_PATH);
  const svg = flattenSvg(rawSvg);

  // Cache rendered PNGs so the ico can reuse them.
  const bySize = new Map<number, Uint8Array>();
  const render = (size: number) => {
    let png = bySize.get(size);
    if (!png) {
      png = renderPng(svg, size);
      bySize.set(size, png);
    }
    return png;
  };

  for (const [name, size] of Object.entries(PNGS)) {
    await Deno.writeFile(new URL(name, STATIC_DIR), render(size));
    console.log(`  ✓ ${name} (${size}×${size})`);
  }

  const ico = buildIco(ICO_SIZES.map((size) => ({ size, png: render(size) })));
  await Deno.writeFile(new URL("favicon.ico", STATIC_DIR), ico);
  console.log(`  ✓ favicon.ico (${ICO_SIZES.join(", ")})`);

  await Deno.writeTextFile(
    new URL("site.webmanifest", STATIC_DIR),
    JSON.stringify(webmanifest, null, 2) + "\n",
  );
  console.log("  ✓ site.webmanifest");

  console.log("✅ favicons generated from static/favicon.svg");
}

await main();
