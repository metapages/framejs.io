import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isLocalUrlValue,
  isUrlDataRef,
  LocalInputUploadError,
  uploadLocalUrlInputs,
} from "/@/utils/localInputs";

const ORIGIN = "https://framejs.io";

// jsdom's Blob has no .text()
const readBlobAsText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(blob);
  });

describe("isLocalUrlValue", () => {
  it.each([
    "http://localhost:4700/data.csv",
    "http://localhost/data.csv",
    "https://localhost:8443/data.csv",
    "http://127.0.0.1:8000/data.json",
    "http://127.1.2.3:8000/data.json",
    "http://[::1]:4700/data.json",
    "http://0.0.0.0:4700/data.json",
    "http://my-server.localhost:4700/data.json",
  ])("%s is local", (url) => {
    expect(isLocalUrlValue(url, ORIGIN)).toBe(true);
  });

  it.each([
    "https://framejs.io/f/abc123",
    "https://example.com/data.json",
    "http://192.168.1.10:4700/data.json", // LAN, not loopback
    "http://localhostings.com/data.json", // suffix must be a real label
    "not a url",
    "/f/abc123",
  ])("%s is not local", (url) => {
    expect(isLocalUrlValue(url, ORIGIN)).toBe(false);
  });

  it("non-string values are not local", () => {
    expect(isLocalUrlValue({ a: 1 }, ORIGIN)).toBe(false);
    expect(isLocalUrlValue(undefined, ORIGIN)).toBe(false);
  });

  it("same-origin urls are never local (dev stack runs on *.localhost)", () => {
    const devOrigin = "https://framejs-io.localhost:4430";
    expect(isLocalUrlValue(`${devOrigin}/f/abc123`, devOrigin)).toBe(false);
    // ...but a different port on the same host still is
    expect(isLocalUrlValue("http://localhost:4700/data.csv", devOrigin)).toBe(
      true,
    );
  });

  // The dev stack can be pinned to a non-localhost hostname (APP_FQDN in .env,
  // e.g. framejs-io.dev mapped to 127.0.0.1) so the page origin is classified
  // the same way production is. Nothing about the decision may change.
  it("classifies the same way when the page origin is not a localhost host", () => {
    const devOrigin = "https://framejs-io.dev:4470";
    expect(isLocalUrlValue("http://localhost:4700/data.csv", devOrigin)).toBe(
      true,
    );
    expect(isLocalUrlValue("http://127.0.0.1:4700/data.csv", devOrigin)).toBe(
      true,
    );
    // Uploaded content lands back on the page's own origin — never re-uploaded,
    // and here that holds on hostname alone, not via the same-origin exemption.
    expect(isLocalUrlValue(`${devOrigin}/f/abc123`, devOrigin)).toBe(false);
    expect(isLocalUrlValue("https://framejs-io.dev:4470/f/abc", "")).toBe(
      false,
    );
  });
});

describe("isUrlDataRef", () => {
  it("type url with string value", () => {
    expect(isUrlDataRef({ type: "url", value: "http://localhost:1/a" })).toBe(
      true,
    );
  });
  it("untyped http string is treated as a url (matches runtime isDataRef)", () => {
    expect(isUrlDataRef({ value: "http://localhost:1/a" })).toBe(true);
  });
  it("utf8/json/base64 refs are not url refs", () => {
    expect(isUrlDataRef({ type: "utf8", value: "http://localhost:1/a" })).toBe(
      false,
    );
    expect(isUrlDataRef({ type: "json", value: { a: 1 } })).toBe(false);
    expect(isUrlDataRef({ type: "base64", value: "aGk=" })).toBe(false);
  });
  it("undefined / non-string values", () => {
    expect(isUrlDataRef(undefined)).toBe(false);
    expect(isUrlDataRef({ type: "url", value: { a: 1 } })).toBe(false);
  });
});

describe("uploadLocalUrlInputs", () => {
  const upload = vi.fn();
  const fetchImpl = vi.fn();

  const options = () => ({ origin: ORIGIN, upload, fetchImpl });

  const response = (body: string, contentType: string, ok = true) =>
    ({
      ok,
      status: ok ? 200 : 404,
      statusText: ok ? "OK" : "Not Found",
      headers: { get: () => contentType },
      blob: async () => new Blob([body], { type: contentType }),
    }) as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined inputs untouched", async () => {
    expect(await uploadLocalUrlInputs(undefined, options())).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("no local urls → same object returned, nothing fetched", async () => {
    const inputs = {
      a: { type: "utf8", value: "hello" },
      b: { type: "url", value: "https://framejs.io/f/abc" },
    };
    const result = await uploadLocalUrlInputs(inputs, options());
    expect(result).toBe(inputs);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("localhost url → fetched, uploaded, and rewritten", async () => {
    fetchImpl.mockResolvedValue(
      response('{"count":1}', "application/json;charset=UTF-8"),
    );
    upload.mockResolvedValue({
      name: "data.json",
      url: "https://framejs.io/f/sha256value",
      contentType: "application/json;charset=UTF-8",
    });

    const inputs = {
      data: { type: "url", value: "http://localhost:4700/files/data.json" },
    };
    const result = await uploadLocalUrlInputs(inputs, options());

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:4700/files/data.json",
    );
    // Filename comes from the URL path, not the input key
    expect(upload.mock.calls[0][0]).toBe("data.json");
    expect(result).toEqual({
      data: { type: "url", value: "https://framejs.io/f/sha256value" },
    });
    // the original object is not mutated
    expect(inputs.data.value).toBe("http://localhost:4700/files/data.json");
  });

  it("preserves the served content-type on the uploaded blob", async () => {
    fetchImpl.mockResolvedValue(response("a,b\n1,2\n", "text/csv"));
    upload.mockResolvedValue({
      name: "t.csv",
      url: "https://framejs.io/f/csv",
      contentType: "text/csv",
    });

    await uploadLocalUrlInputs(
      { t: { type: "url", value: "http://127.0.0.1:8000/t.csv" } },
      options(),
    );

    const blob: Blob = upload.mock.calls[0][1];
    expect(blob.type).toBe("text/csv");
    expect(await readBlobAsText(blob)).toBe("a,b\n1,2\n");
  });

  it("falls back to the input key when the url has no filename", async () => {
    fetchImpl.mockResolvedValue(response("hi", "text/plain"));
    upload.mockResolvedValue({
      name: "greeting",
      url: "https://framejs.io/f/x",
      contentType: "text/plain",
    });

    await uploadLocalUrlInputs(
      { greeting: { type: "url", value: "http://localhost:4700/" } },
      options(),
    );
    expect(upload.mock.calls[0][0]).toBe("greeting");
  });

  it("rewrites only local urls, leaving every other input alone", async () => {
    fetchImpl.mockResolvedValue(response("local", "text/plain"));
    upload.mockResolvedValue({
      name: "local.txt",
      url: "https://framejs.io/f/local",
      contentType: "text/plain",
    });

    const result = await uploadLocalUrlInputs(
      {
        local: { type: "url", value: "http://localhost:4700/local.txt" },
        remote: { type: "url", value: "https://example.com/remote.txt" },
        inline: { type: "utf8", value: "http://localhost:4700/not-a-ref" },
        obj: { type: "json", value: { a: 1 } },
      },
      options(),
    );

    expect(result).toEqual({
      local: { type: "url", value: "https://framejs.io/f/local" },
      remote: { type: "url", value: "https://example.com/remote.txt" },
      inline: { type: "utf8", value: "http://localhost:4700/not-a-ref" },
      obj: { type: "json", value: { a: 1 } },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("uploads multiple local inputs in parallel", async () => {
    fetchImpl.mockResolvedValue(response("x", "text/plain"));
    upload
      .mockResolvedValueOnce({
        name: "a.txt",
        url: "https://framejs.io/f/a",
        contentType: "text/plain",
      })
      .mockResolvedValueOnce({
        name: "b.txt",
        url: "https://framejs.io/f/b",
        contentType: "text/plain",
      });

    const result = await uploadLocalUrlInputs(
      {
        a: { type: "url", value: "http://localhost:4700/a.txt" },
        b: { type: "url", value: "http://localhost:4701/b.txt" },
      },
      options(),
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      a: { type: "url", value: "https://framejs.io/f/a" },
      b: { type: "url", value: "https://framejs.io/f/b" },
    });
  });

  it("throws LocalInputUploadError when the local server is unreachable", async () => {
    fetchImpl.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      uploadLocalUrlInputs(
        { data: { type: "url", value: "http://localhost:4700/data.json" } },
        options(),
      ),
    ).rejects.toMatchObject({
      name: "LocalInputUploadError",
      key: "data",
      url: "http://localhost:4700/data.json",
    });
  });

  it("throws LocalInputUploadError on a non-ok response", async () => {
    fetchImpl.mockResolvedValue(response("", "text/plain", false));

    const error = await uploadLocalUrlInputs(
      { data: { type: "url", value: "http://localhost:4700/missing.json" } },
      options(),
    ).catch((e) => e);

    expect(error).toBeInstanceOf(LocalInputUploadError);
    expect(error.message).toContain("404");
    expect(upload).not.toHaveBeenCalled();
  });

  it("throws LocalInputUploadError when the remote upload fails", async () => {
    fetchImpl.mockResolvedValue(response("x", "text/plain"));
    upload.mockRejectedValue(new Error("Presign failed: 503"));

    const error = await uploadLocalUrlInputs(
      { data: { type: "url", value: "http://localhost:4700/data.json" } },
      options(),
    ).catch((e) => e);

    expect(error).toBeInstanceOf(LocalInputUploadError);
    expect(error.message).toContain("Presign failed: 503");
  });
});
