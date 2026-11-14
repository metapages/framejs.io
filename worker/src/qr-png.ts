// QR code → PNG, with nothing but web-platform APIs.
//
// qrcode's own `toBuffer` is Node-only (pngjs over node:zlib and streams), and
// its browser build renders to a <canvas>. Neither runs on Cloudflare Workers.
// So only the symbol comes from qrcode — `create`, from its pure core module —
// and the rasterizing and PNG encoding happen here. The pixel mapping mirrors
// qrcode's `getScale` / `qrToImageData`, so the image is the one `toBuffer`
// produced (8-bit grayscale here instead of RGBA; black on white either way).

import QRCodeCore from "qrcode/lib/core/qrcode.js";

type QrSymbol = { modules: { size: number; data: Uint8Array } };

export type QrPngOptions = {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  /** Quiet zone, in modules. */
  margin?: number;
  /** Image width (and height) in pixels. */
  width?: number;
};

export async function qrCodePng(
  text: string,
  { errorCorrectionLevel = "M", margin = 2, width = 512 }: QrPngOptions = {},
): Promise<Uint8Array> {
  const { modules } = (QRCodeCore as {
    create: (text: string, opts: object) => QrSymbol;
  }).create(text, { errorCorrectionLevel });
  const { size, data } = modules;

  // qrcode's getScale: fit the requested width when it can hold one pixel per
  // module, else its default of 4 px per module.
  const scale = width >= size + margin * 2 ? width / (size + margin * 2) : 4;
  const symbolSize = Math.floor((size + margin * 2) * scale);
  const scaledMargin = margin * scale;

  // One filter byte (0: none) per row, then one gray byte per pixel.
  const stride = symbolSize + 1;
  const raw = new Uint8Array(stride * symbolSize);
  for (let i = 0; i < symbolSize; i++) {
    for (let j = 0; j < symbolSize; j++) {
      let dark = false;
      if (
        i >= scaledMargin && j >= scaledMargin &&
        i < symbolSize - scaledMargin && j < symbolSize - scaledMargin
      ) {
        const iSrc = Math.floor((i - scaledMargin) / scale);
        const jSrc = Math.floor((j - scaledMargin) / scale);
        dark = !!data[iSrc * size + jSrc];
      }
      raw[i * stride + 1 + j] = dark ? 0x00 : 0xff;
    }
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, symbolSize);
  view.setUint32(4, symbolSize);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // color type: grayscale
  // compression, filter and interlace methods: all 0

  return concat([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", await zlibDeflate(raw)),
    chunk("IEND", new Uint8Array()),
  ]);
}

// CompressionStream's "deflate" is the zlib format (RFC 1950), which is what
// PNG's IDAT holds.
async function zlibDeflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
    new CompressionStream("deflate"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

let crcTable: Uint32Array | undefined;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
