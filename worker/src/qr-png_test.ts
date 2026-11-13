import { Buffer } from "node:buffer";
import { assertEquals } from "@std/assert";
import QRCode from "npm:qrcode@1.5.4";
import { PNG } from "npm:pngjs@5.0.0";

import { qrCodePng } from "./qr-png.ts";

const decode = (bytes: Uint8Array) => PNG.sync.read(Buffer.from(bytes));

Deno.test("qrCodePng draws the same pixels as qrcode's toBuffer", async () => {
  const text =
    "https://framejs.io/j/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef?x=1";
  const options = { errorCorrectionLevel: "M", margin: 2, width: 512 } as const;

  const expected = decode(
    await QRCode.toBuffer(text, { type: "png", ...options }),
  );
  const actual = decode(await qrCodePng(text, options));

  assertEquals(actual.width, expected.width);
  assertEquals(actual.height, expected.height);
  // Both decode to RGBA: compare the red channel, which is 0 or 255 in each.
  let mismatches = 0;
  for (let i = 0; i < expected.data.length; i += 4) {
    if (actual.data[i] !== expected.data[i]) mismatches++;
  }
  assertEquals(mismatches, 0);
});
