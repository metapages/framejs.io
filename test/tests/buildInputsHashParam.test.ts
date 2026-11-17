// buildInputsHashParam builds the `inputs` hash param for every url the editor
// writes out: Save, Snapshot / standalone export, and Copy link.
//
// The reserved source input (`__framejs_source`) arrives in the same metaframe
// input map as the frame's own inputs, but it is the editor's copy of the
// frame's CODE. It must never reach a written url — a stale copy there blanks
// the next editor (metapages/framejs.io#146) — and it must never be uploaded:
// it is usually over the upload threshold, and uploading it only to drop the
// result is a wasted round trip and an orphaned public copy of the source.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("/@/hooks/useFileUpload", () => ({
  uploadString: vi.fn(async () => ({ url: "https://files.example.com/f/str" })),
  uploadJson: vi.fn(async () => ({ url: "https://files.example.com/f/json" })),
  uploadBlob: vi.fn(async () => ({ url: "https://files.example.com/f/blob" })),
}));

import { uploadBlob, uploadJson, uploadString } from "/@/hooks/useFileUpload";
import { buildInputsHashParam } from "/@/utils/convertInputs";
import { RESERVED_SOURCE_INPUT } from "/@/utils/frameSource";

// Well over the 200-char upload threshold, like any real frame's source.
const BIG_SOURCE = "console.log('the entire frame source');\n".repeat(50);

const uploads = () =>
  vi.mocked(uploadString).mock.calls.length +
  vi.mocked(uploadJson).mock.calls.length +
  vi.mocked(uploadBlob).mock.calls.length;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildInputsHashParam", () => {
  it("never uploads the reserved source from the live inputs", async () => {
    const result = await buildInputsHashParam(undefined, {
      [RESERVED_SOURCE_INPUT]: BIG_SOURCE,
    });
    expect(uploads()).toBe(0);
    expect(result).toBeUndefined();
  });

  it("drops a leaked copy already in the url's inputs", async () => {
    // The exact `inputs` from the url in metapages/framejs.io#146.
    const result = await buildInputsHashParam(
      { [RESERVED_SOURCE_INPUT]: { type: "utf8", value: "" } },
      undefined,
    );
    expect(result).toBeUndefined();
  });

  it("keeps the frame's own inputs, from the url and live", async () => {
    const result = await buildInputsHashParam(
      {
        fromUrl: { type: "json", value: { a: 1 } },
        [RESERVED_SOURCE_INPUT]: { type: "utf8", value: "" },
      },
      { live: "small", [RESERVED_SOURCE_INPUT]: BIG_SOURCE },
    );
    expect(result).toEqual({
      fromUrl: { type: "json", value: { a: 1 } },
      live: { type: "utf8", value: "small" },
    });
    expect(uploads()).toBe(0);
  });

  it("still uploads a large input of the frame's own", async () => {
    const big = "x".repeat(1000);
    const result = await buildInputsHashParam(undefined, {
      big,
      [RESERVED_SOURCE_INPUT]: BIG_SOURCE,
    });
    // Exactly one upload — the frame's input, not the source.
    expect(uploads()).toBe(1);
    expect(vi.mocked(uploadString)).toHaveBeenCalledWith("big", big);
    expect(Object.keys(result!)).toEqual(["big"]);
    expect(result!.big.type).toBe("url");
  });

  it("live inputs win over the url's", async () => {
    const result = await buildInputsHashParam(
      { a: { type: "utf8", value: "old" } },
      { a: "new" },
    );
    expect(result).toEqual({ a: { type: "utf8", value: "new" } });
  });
});
