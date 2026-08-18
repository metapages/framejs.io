import { expect, test } from "@playwright/test";

// Helper: create a short URL via the JSON API and return the id.
async function createShortUrl(
  request: import("@playwright/test").APIRequestContext,
  js: string,
  extra?: Record<string, unknown>,
) {
  const response = await request.post("/api/shorten/json", {
    data: { js, ...extra },
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{
    id: string;
    shortUrl: string;
    fullUrl: string;
    hashParams: string;
  }>;
}

// ---------------------------------------------------------------------------
// API round-trip tests — upload via presign, download via /f/:id
// ---------------------------------------------------------------------------

test("upload string via presign → download preserves content and content-type", async ({
  request,
}) => {
  const content = "hello world from presign test";
  const contentType = "text/plain;charset=UTF-8";

  // Get presigned URL
  const presignRes = await request.post("/api/upload/presign", {
    data: {
      contentType,
      fileSize: content.length,
      sha256: "ignored-for-test", // server recomputes
    },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  // Upload
  const uploadRes = await request.put(presignedUrl, {
    data: content,
    headers: { "Content-Type": contentType },
  });
  expect(uploadRes.ok()).toBeTruthy();

  // Download via canonical path
  const downloadRes = await request.get(canonicalPath);
  expect(downloadRes.ok()).toBeTruthy();
  const body = await downloadRes.text();
  expect(body).toBe(content);
  const ct = downloadRes.headers()["content-type"] || "";
  expect(ct).toContain("text/plain");
});

test("upload JSON via presign → download preserves JSON and content-type", async ({
  request,
}) => {
  const obj = { greeting: "hello", count: 42 };
  const content = JSON.stringify(obj);
  const contentType = "application/json;charset=UTF-8";

  const presignRes = await request.post("/api/upload/presign", {
    data: {
      contentType,
      fileSize: content.length,
      sha256: "ignored",
    },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  const uploadRes = await request.put(presignedUrl, {
    data: content,
    headers: { "Content-Type": contentType },
  });
  expect(uploadRes.ok()).toBeTruthy();

  const downloadRes = await request.get(canonicalPath);
  expect(downloadRes.ok()).toBeTruthy();
  const downloaded = await downloadRes.json();
  expect(downloaded).toEqual(obj);
  const ct = downloadRes.headers()["content-type"] || "";
  expect(ct).toContain("application/json");
});

test("upload binary via presign → download preserves content-type", async ({
  request,
}) => {
  // Create a small PNG-like binary payload
  const binaryData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
    0x00, 0x00, 0x00, 0x00, // some data
  ]);
  const contentType = "image/png";

  const presignRes = await request.post("/api/upload/presign", {
    data: {
      contentType,
      fileSize: binaryData.length,
      sha256: "ignored",
    },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  const uploadRes = await request.put(presignedUrl, {
    data: binaryData,
    headers: { "Content-Type": contentType },
  });
  expect(uploadRes.ok()).toBeTruthy();

  const downloadRes = await request.get(canonicalPath);
  expect(downloadRes.ok()).toBeTruthy();
  const ct = downloadRes.headers()["content-type"] || "";
  expect(ct).toContain("image/png");
});

// ---------------------------------------------------------------------------
// Browser round-trip tests — upload + short URL + onInputs
// ---------------------------------------------------------------------------

test("short URL with { type: 'url' } string input delivers string to onInputs", async ({
  request,
  page,
}) => {
  // First upload the string content
  const content = "hello from uploaded string DataRef";
  const contentType = "text/plain;charset=UTF-8";

  const presignRes = await request.post("/api/upload/presign", {
    data: { contentType, fileSize: content.length, sha256: "ignored" },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  await request.put(presignedUrl, {
    data: content,
    headers: { "Content-Type": contentType },
  });

  const fileUrl = `${page.url() ? new URL(page.url()).origin : ""}${canonicalPath}`;
  // Construct an absolute URL for the DataRef
  const baseUrl = (await request.get("/")).url().replace(/\/$/, "");
  const absoluteUrl = `${baseUrl}${canonicalPath}`;

  // Create a short URL with the uploaded content as a url-type DataRef
  const js = [
    'export const onInputs = (inputs) => {',
    '  const el = document.getElementById("root");',
    '  el.textContent = typeof inputs.greeting + ":" + inputs.greeting;',
    '};',
  ].join("\n");
  const inputs = {
    greeting: { type: "url", value: absoluteUrl },
  };
  const { id } = await createShortUrl(request, js, { inputs });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  // The resolveDataRef should fetch the URL and deliver the content as a string
  // (because content-type is text/plain)
  await expect(page.locator("#root")).toContainText("string:hello from uploaded string DataRef", {
    timeout: 15_000,
  });
});

test("short URL with { type: 'url' } JSON input delivers parsed object to onInputs", async ({
  request,
  page,
}) => {
  const obj = { message: "hello", nested: { value: 123 } };
  const content = JSON.stringify(obj);
  const contentType = "application/json;charset=UTF-8";

  const presignRes = await request.post("/api/upload/presign", {
    data: { contentType, fileSize: content.length, sha256: "ignored" },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  await request.put(presignedUrl, {
    data: content,
    headers: { "Content-Type": contentType },
  });

  const baseUrl = (await request.get("/")).url().replace(/\/$/, "");
  const absoluteUrl = `${baseUrl}${canonicalPath}`;

  const js = [
    'export const onInputs = (inputs) => {',
    '  const el = document.getElementById("root");',
    '  el.textContent = typeof inputs.data + ":" + JSON.stringify(inputs.data);',
    '};',
  ].join("\n");
  const inputs = {
    data: { type: "url", value: absoluteUrl },
  };
  const { id } = await createShortUrl(request, js, { inputs });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  // The resolveDataRef should fetch the URL and deliver a parsed object
  // (because content-type is application/json)
  await expect(page.locator("#root")).toContainText('object:', {
    timeout: 15_000,
  });
  await expect(page.locator("#root")).toContainText('"message":"hello"', {
    timeout: 15_000,
  });
});

test("short URL with a bare text/x-uri dataref string delivers the referenced content", async ({
  request,
  page,
}) => {
  const content = "hello from a text/x-uri dataref";
  const contentType = "text/plain;charset=UTF-8";

  const presignRes = await request.post("/api/upload/presign", {
    data: { contentType, fileSize: content.length, sha256: "ignored" },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  await request.put(presignedUrl, {
    data: content,
    headers: { "Content-Type": contentType },
  });

  const baseUrl = (await request.get("/")).url().replace(/\/$/, "");
  const absoluteUrl = `${baseUrl}${canonicalPath}`;

  const js = [
    'export const onInputs = (inputs) => {',
    '  const el = document.getElementById("root");',
    '  el.textContent = typeof inputs.greeting + ":" + inputs.greeting;',
    '};',
  ].join("\n");
  // A v2 dataref (@metapages/dataref): the value is a reference to the bytes,
  // not the bytes. The user's JS must never see the literal data URL.
  const inputs = {
    greeting: `data:text/x-uri;charset=utf-8,${encodeURIComponent(absoluteUrl)}`,
  };
  const { id } = await createShortUrl(request, js, { inputs });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toContainText(`string:${content}`, {
    timeout: 15_000,
  });
  await expect(page.locator("#root")).not.toContainText("data:text/x-uri");
});

test("short URL with { type: 'url' } wrapping a text/x-uri dataref delivers the referenced content", async ({
  request,
  page,
}) => {
  const obj = { message: "x-uri wrapped", nested: { value: 7 } };
  const content = JSON.stringify(obj);
  const contentType = "application/json;charset=UTF-8";

  const presignRes = await request.post("/api/upload/presign", {
    data: { contentType, fileSize: content.length, sha256: "ignored" },
  });
  expect(presignRes.ok()).toBeTruthy();
  const { presignedUrl, canonicalPath } = await presignRes.json();

  await request.put(presignedUrl, {
    data: content,
    headers: { "Content-Type": contentType },
  });

  const baseUrl = (await request.get("/")).url().replace(/\/$/, "");
  const absoluteUrl = `${baseUrl}${canonicalPath}`;

  const js = [
    'export const onInputs = (inputs) => {',
    '  const el = document.getElementById("root");',
    '  el.textContent = typeof inputs.data + ":" + JSON.stringify(inputs.data);',
    '};',
  ].join("\n");
  const inputs = {
    data: {
      type: "url",
      value: `data:text/x-uri;charset=utf-8,${encodeURIComponent(absoluteUrl)}`,
    },
  };
  const { id } = await createShortUrl(request, js, { inputs });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toContainText('"message":"x-uri wrapped"', {
    timeout: 15_000,
  });
});
