import { beforeEach, describe, expect, it, vi } from "vitest";

// Polyfill Blob.arrayBuffer for jsdom environments that lack it
if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(this);
    });
  };
}

import { convertInputValue, convertMetaframeInputs } from "/@/utils/convertInputs";

// Mock the upload functions from useFileUpload
vi.mock("/@/hooks/useFileUpload", () => ({
  uploadString: vi.fn(),
  uploadJson: vi.fn(),
  uploadBlob: vi.fn(),
}));

import { uploadString, uploadJson, uploadBlob } from "/@/hooks/useFileUpload";

const mockUploadString = vi.mocked(uploadString);
const mockUploadJson = vi.mocked(uploadJson);
const mockUploadBlob = vi.mocked(uploadBlob);

describe("convertInputValue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Small values: inline, no upload --

  it("small string → { type: 'utf8' } (inline, no upload)", async () => {
    const result = await convertInputValue("greeting", "hello");
    expect(result).toEqual({ type: "utf8", value: "hello" });
    expect(mockUploadString).not.toHaveBeenCalled();
  });

  it("text/x-uri dataref string → { type: 'url' } with the referenced url", async () => {
    const url = "https://framejs.io/f/sha256value";
    const result = await convertInputValue(
      "greeting",
      `data:text/x-uri;charset=utf-8,${encodeURIComponent(url)}`,
    );
    expect(result).toEqual({ type: "url", value: url });
    expect(mockUploadString).not.toHaveBeenCalled();
  });

  it("other data urls are still treated as strings", async () => {
    const value = "data:image/png;base64,aGk=";
    const result = await convertInputValue("img", value);
    expect(result).toEqual({ type: "utf8", value });
  });

  it("small object → { type: 'json' } (inline)", async () => {
    const obj = { foo: "bar", count: 42 };
    const result = await convertInputValue("data", obj);
    expect(result).toEqual({ type: "json", value: obj });
    expect(mockUploadJson).not.toHaveBeenCalled();
  });

  it("small Blob → { type: 'base64' } (inline)", async () => {
    const blob = new Blob(["small data"], { type: "image/png" });
    const result = await convertInputValue("img", blob);
    expect(result.type).toBe("base64");
    expect(typeof result.value).toBe("string");
    expect(mockUploadBlob).not.toHaveBeenCalled();
  });

  // -- Large values: uploaded to S3 --

  it("large string → calls uploadString, returns { type: 'url' }", async () => {
    const largeString = "x".repeat(20_000);
    mockUploadString.mockResolvedValue({
      name: "bigtext",
      url: "https://example.com/f/abc123",
      contentType: "text/plain;charset=UTF-8",
    });

    const result = await convertInputValue("bigtext", largeString);
    expect(result).toEqual({ type: "url", value: "https://example.com/f/abc123" });
    expect(mockUploadString).toHaveBeenCalledWith("bigtext", largeString);
  });

  it("large JSON → calls uploadJson, returns { type: 'url' }", async () => {
    // Create an object whose JSON is > 10KB
    const largeObj = { data: "x".repeat(20_000) };
    mockUploadJson.mockResolvedValue({
      name: "bigjson",
      url: "https://example.com/f/def456",
      contentType: "application/json;charset=UTF-8",
    });

    const result = await convertInputValue("bigjson", largeObj);
    expect(result).toEqual({ type: "url", value: "https://example.com/f/def456" });
    expect(mockUploadJson).toHaveBeenCalledWith("bigjson", largeObj);
  });

  it("large Blob → calls uploadBlob, returns { type: 'url' } with original type", async () => {
    const largeData = new Uint8Array(20_000).fill(65); // 'A' repeated
    const blob = new Blob([largeData], { type: "image/png" });
    mockUploadBlob.mockResolvedValue({
      name: "bigimg",
      url: "https://example.com/f/ghi789",
      contentType: "image/png",
    });

    const result = await convertInputValue("bigimg", blob);
    expect(result).toEqual({ type: "url", value: "https://example.com/f/ghi789" });
    expect(mockUploadBlob).toHaveBeenCalledWith("bigimg", blob);
  });

  // -- Upload failure: graceful fallback --

  it("upload failure for large string → falls back to inline utf8", async () => {
    const largeString = "x".repeat(20_000);
    mockUploadString.mockRejectedValue(new Error("Network error"));

    const result = await convertInputValue("failing", largeString);
    expect(result).toEqual({ type: "utf8", value: largeString });
  });

  it("upload failure for large blob → falls back to inline base64 (not dropped)", async () => {
    const largeData = new Uint8Array(20_000).fill(65);
    const blob = new Blob([largeData], { type: "image/png" });
    mockUploadBlob.mockRejectedValue(new Error("Upload failed"));

    const result = await convertInputValue("failblob", blob);
    expect(result.type).toBe("base64");
    expect(typeof result.value).toBe("string");
    // Verify it's a valid base64 string (should not be empty)
    expect(result.value.length).toBeGreaterThan(0);
  });

  it("upload failure for large JSON → falls back to inline json", async () => {
    const largeObj = { data: "x".repeat(20_000) };
    mockUploadJson.mockRejectedValue(new Error("Server error"));

    const result = await convertInputValue("failjson", largeObj);
    expect(result).toEqual({ type: "json", value: largeObj });
  });

  // -- Edge cases --

  it("number values → { type: 'json' }", async () => {
    const result = await convertInputValue("num", 42 as any);
    expect(result).toEqual({ type: "json", value: 42 });
  });

  it("boolean values → { type: 'json' }", async () => {
    const result = await convertInputValue("flag", true as any);
    expect(result).toEqual({ type: "json", value: true });
  });
});

describe("convertMetaframeInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts multiple inputs and merges with existing", async () => {
    const existing = { old: { type: "utf8", value: "keep me" } };
    const inputs = {
      greeting: "hello",
      data: { count: 1 },
    };

    const result = await convertMetaframeInputs(inputs, existing);
    expect(result.old).toEqual({ type: "utf8", value: "keep me" });
    expect(result.greeting).toEqual({ type: "utf8", value: "hello" });
    expect(result.data).toEqual({ type: "json", value: { count: 1 } });
  });

  it("processes uploads in parallel", async () => {
    const largeA = "a".repeat(20_000);
    const largeB = "b".repeat(20_000);

    let resolveFnA: (v: any) => void;
    let resolveFnB: (v: any) => void;
    const promiseA = new Promise<any>((r) => { resolveFnA = r; });
    const promiseB = new Promise<any>((r) => { resolveFnB = r; });

    mockUploadString
      .mockReturnValueOnce(promiseA)
      .mockReturnValueOnce(promiseB);

    const resultPromise = convertMetaframeInputs({ a: largeA, b: largeB });

    // Both uploads should have been initiated
    expect(mockUploadString).toHaveBeenCalledTimes(2);

    // Resolve both
    resolveFnA!({ name: "a", url: "https://example.com/f/a", contentType: "text/plain" });
    resolveFnB!({ name: "b", url: "https://example.com/f/b", contentType: "text/plain" });

    const result = await resultPromise;
    expect(result.a).toEqual({ type: "url", value: "https://example.com/f/a" });
    expect(result.b).toEqual({ type: "url", value: "https://example.com/f/b" });
  });
});
