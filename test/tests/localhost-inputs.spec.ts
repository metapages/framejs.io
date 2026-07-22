import { createHash } from "node:crypto";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";

import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Inputs that point at http://localhost:<port>
//
// A user running a file server on their own machine (e.g. the framejs
// local-server, `python -m http.server`, a dev API) can reference it from the
// `inputs` hash param as { type: "url", value: "http://localhost:4700/x.json" }.
//
// Two behaviours are covered here:
//   1. The renderer resolves those URLs at run time, exactly like any other
//      url DataRef — the frame works on the author's machine.
//   2. "Create expiring snapshot" first copies that content into the remote
//      file store and rewrites the reference, because a snapshot is shared and
//      immutable: nobody else can reach the author's localhost.
//
// Host note: by default the stack answers on framejs-io.localhost, so the page
// origin is itself a localhost host and "is this input local?" is partly
// decided by a same-origin exemption. Set APP_FQDN to a non-localhost host that
// maps to 127.0.0.1 (see .env, or run `just test-nonlocal`) to check the same
// tests the way production sees them. Both modes must pass.
// ---------------------------------------------------------------------------

const JSON_BODY = JSON.stringify({ message: "hello from localhost", count: 7 });
const TEXT_BODY = "notes served from the author's own machine";

const sha256 = (body: string) =>
  createHash("sha256").update(body, "utf8").digest("hex");

let server: Server;
let localOrigin: string;
let localPort: number;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    // The frame page is served from an https origin, so every read is a
    // cross-origin request. A local server must opt in — including Chrome's
    // Private Network Access preflight header.
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-allow-private-network": "true",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/data.json") {
      res.writeHead(200, { ...cors, "content-type": "application/json" });
      res.end(JSON_BODY);
      return;
    }
    if (path === "/notes.txt") {
      res.writeHead(200, { ...cors, "content-type": "text/plain" });
      res.end(TEXT_BODY);
      return;
    }
    res.writeHead(404, cors);
    res.end("not found");
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  localPort = port;
  localOrigin = `http://localhost:${port}`;
  console.log(
    `[localhost-inputs] local server ${localOrigin}, app host ${
      process.env.APP_FQDN ?? "framejs-io.localhost (default)"
    }`,
  );
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// Mint a short URL (and its hash-param string) via the JSON API.
async function createShortUrl(
  request: import("@playwright/test").APIRequestContext,
  js: string,
  extra?: Record<string, unknown>,
) {
  const response = await request.post("/api/shorten/json", {
    data: { js, ...extra },
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{ id: string; hashParams: string }>;
}

const RENDER_INPUTS_JS = [
  "export const onInputs = (inputs) => {",
  '  const el = document.getElementById("root");',
  "  el.textContent = Object.entries(inputs)",
  '    .map(([k, v]) => k + "=" + (typeof v === "object" ? JSON.stringify(v) : v))',
  '    .join(" | ");',
  "};",
].join("\n");

// ---------------------------------------------------------------------------
// 1. The renderer resolves localhost url DataRefs
// ---------------------------------------------------------------------------

test("localhost JSON input is fetched and delivered to onInputs", async ({
  page,
}) => {
  const { id } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { data: { type: "url", value: `${localOrigin}/data.json` } },
  });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toContainText(
    '"message":"hello from localhost"',
    { timeout: 15_000 },
  );
});

test("localhost text input is fetched and delivered as a string", async ({
  page,
}) => {
  const { id } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { notes: { type: "url", value: `${localOrigin}/notes.txt` } },
  });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toContainText(`notes=${TEXT_BODY}`, {
    timeout: 15_000,
  });
});

test("localhost input works from a full hash-param URL too (no short url)", async ({
  page,
}) => {
  // Reuse the API to build the hash-param string, then load it directly.
  const { hashParams } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { notes: { type: "url", value: `${localOrigin}/notes.txt` } },
  });

  await page.goto(`/#${hashParams}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toContainText(`notes=${TEXT_BODY}`, {
    timeout: 15_000,
  });
});

// ---------------------------------------------------------------------------
// 2. "Create expiring snapshot" uploads localhost content first
// ---------------------------------------------------------------------------

// Open the editor standalone at the given hash params and click the snapshot
// button, returning the /api/shorten response body.
async function clickSnapshot(
  page: import("@playwright/test").Page,
  hashParams: string,
) {
  await page.goto(`/editor/#${hashParams}`);
  const button = page.locator('[aria-label="create expiring snapshot"]');
  await expect(button).toBeVisible({ timeout: 15_000 });

  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/api/shorten") && r.request().method() === "POST",
    { timeout: 30_000 },
  );
  await button.click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{ id: string }>;
}

test("snapshot uploads localhost input content and rewrites the reference", async ({
  page,
  request,
}) => {
  const { hashParams } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { data: { type: "url", value: `${localOrigin}/data.json` } },
  });

  const { id } = await clickSnapshot(page, hashParams);

  // The stored snapshot must no longer reference the author's machine.
  const stored = await request.get(`/api/j/${id}`);
  expect(stored.ok()).toBeTruthy();
  const { hashParams: storedParams } = await stored.json();
  const value: string = storedParams.inputs.data.value;

  expect(value).not.toContain(localOrigin);
  // Rewritten to this origin's canonical content-addressed path.
  const rewritten = new URL(value);
  expect(rewritten.origin).toBe(new URL(page.url()).origin);
  expect(rewritten.pathname).toBe(`/f/${sha256(JSON_BODY)}`);
  expect(storedParams.inputs.data.type).toBe("url");

  // ...and the uploaded content round-trips.
  const download = await request.get(rewritten.pathname);
  expect(download.ok()).toBeTruthy();
  expect(await download.json()).toEqual(JSON.parse(JSON_BODY));
  expect(download.headers()["content-type"]).toContain("application/json");
});

test("the rewritten snapshot renders without touching the local server", async ({
  page,
  request,
}) => {
  const { hashParams } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { notes: { type: "url", value: `${localOrigin}/notes.txt` } },
  });

  const { id } = await clickSnapshot(page, hashParams);

  const localRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().startsWith(localOrigin)) localRequests.push(r.url());
  });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toContainText(`notes=${TEXT_BODY}`, {
    timeout: 15_000,
  });
  // The content now comes from the remote store, not the author's machine.
  expect(localRequests).toEqual([]);
});

test("snapshot uploads a 127.0.0.1 input too, whatever host the app runs on", async ({
  page,
  request,
}) => {
  // A literal loopback IP can never be the page's own origin, so this holds
  // identically on framejs-io.localhost and on a non-localhost APP_FQDN — it
  // tests the classification itself, not the same-origin exemption.
  const { hashParams } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: {
      data: { type: "url", value: `http://127.0.0.1:${localPort}/data.json` },
    },
  });

  const { id } = await clickSnapshot(page, hashParams);

  const stored = await request.get(`/api/j/${id}`);
  const { hashParams: storedParams } = await stored.json();
  const rewritten = new URL(storedParams.inputs.data.value);

  expect(rewritten.hostname).not.toBe("127.0.0.1");
  expect(rewritten.origin).toBe(new URL(page.url()).origin);
  expect(rewritten.pathname).toBe(`/f/${sha256(JSON_BODY)}`);
});

test("snapshotting an already-rewritten input does not upload again", async ({
  page,
  request,
}) => {
  // The rewritten URL lives on the app's own origin. It must never be mistaken
  // for a local one — otherwise every re-snapshot re-uploads the same bytes.
  const first = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { data: { type: "url", value: `${localOrigin}/data.json` } },
  });
  const { id } = await clickSnapshot(page, first.hashParams);
  const stored = await request.get(`/api/j/${id}`);
  const { hashParams: storedParams } = await stored.json();
  const rewrittenUrl: string = storedParams.inputs.data.value;

  // Snapshot the result of the first snapshot.
  const second = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { data: { type: "url", value: rewrittenUrl } },
  });

  await page.goto(`/editor/#${second.hashParams}`);
  const button = page.locator('[aria-label="create expiring snapshot"]');
  await expect(button).toBeVisible({ timeout: 15_000 });

  const presigns: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/upload/presign")) presigns.push(r.url());
  });

  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/api/shorten") && r.request().method() === "POST",
    { timeout: 30_000 },
  );
  await button.click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  const { id: secondId } = await response.json();

  const storedAgain = await request.get(`/api/j/${secondId}`);
  const { hashParams: secondParams } = await storedAgain.json();
  expect(secondParams.inputs.data.value).toBe(rewrittenUrl);
  expect(presigns).toEqual([]);
});

test("snapshot leaves non-localhost url inputs untouched", async ({
  page,
  request,
}) => {
  const remoteUrl = "https://example.com/remote-data.json";
  const { hashParams } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: {
      remote: { type: "url", value: remoteUrl },
      inline: { type: "utf8", value: "stays inline" },
    },
  });

  const { id } = await clickSnapshot(page, hashParams);

  const stored = await request.get(`/api/j/${id}`);
  const { hashParams: storedParams } = await stored.json();
  expect(storedParams.inputs.remote).toEqual({
    type: "url",
    value: remoteUrl,
  });
  expect(storedParams.inputs.inline).toEqual({
    type: "utf8",
    value: "stays inline",
  });
});

test("snapshot is aborted with an error when the local server is unreachable", async ({
  page,
}) => {
  // Port 1 has nothing listening — the fetch fails.
  const { hashParams } = await createShortUrl(page.request, RENDER_INPUTS_JS, {
    inputs: { data: { type: "url", value: "http://localhost:1/data.json" } },
  });

  await page.goto(`/editor/#${hashParams}`);
  const button = page.locator('[aria-label="create expiring snapshot"]');
  await expect(button).toBeVisible({ timeout: 15_000 });

  const shortenPosts: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/shorten") && r.method() === "POST") {
      shortenPosts.push(r.url());
    }
  });

  await button.click();

  await expect(page.getByText("Local input could not be uploaded")).toBeVisible(
    { timeout: 20_000 },
  );
  // No snapshot was minted — a broken localhost reference is never persisted.
  expect(shortenPosts).toEqual([]);
});
