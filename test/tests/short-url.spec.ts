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
// API tests
// ---------------------------------------------------------------------------

test("POST /api/shorten/json returns id, shortUrl, fullUrl", async ({
  request,
}) => {
  const body = await createShortUrl(request, "console.log(1)");
  expect(body).toHaveProperty("id");
  expect(body).toHaveProperty("shortUrl");
  expect(body).toHaveProperty("fullUrl");
  expect(body).toHaveProperty("hashParams");
  expect(body.shortUrl).toContain("/j/");
});

test("GET /api/j/:sha256 returns id and decoded hashParams object", async ({ request }) => {
  const { id } = await createShortUrl(request, 'console.log("api test")');

  const response = await request.get(`/api/j/${id}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.id).toBe(id);
  expect(body).toHaveProperty("hashParams");
  expect(typeof body.hashParams).toBe("object");
  expect(body.hashParams.js).toBe('console.log("api test")');
});

test("GET /api/j/:sha256/url returns the full URL as plain text", async ({ request }) => {
  const { id, fullUrl } = await createShortUrl(request, 'console.log("url test")');

  const response = await request.get(`/api/j/${id}/url`);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("text/plain");

  const text = await response.text();
  // Should be a valid URL with hash params containing the js code
  expect(text).toContain("/#");
  expect(text).toContain("js=");
  // Should match the fullUrl from the shorten response
  expect(text).toBe(fullUrl);
});

// ---------------------------------------------------------------------------
// Browser tests – basic short URL serving
// ---------------------------------------------------------------------------

test("GET /j/:sha256 serves HTML without redirect, URL stays on /j/...", async ({
  page,
}) => {
  const { id } = await createShortUrl(
    page.request,
    'console.log("hello short url")',
  );

  const responses: string[] = [];
  page.on("response", (r) => responses.push(r.url()));

  await page.goto(`/j/${id}`);

  // URL should stay on /j/... (no redirect to /#)
  expect(page.url()).toContain(`/j/${id}`);
  expect(page.url()).not.toMatch(/^\/?#/);
});

test("window.__SHORT_URL_ID is set after visiting short URL", async ({
  page,
}) => {
  const { id } = await createShortUrl(page.request, "const x = 42;");

  await page.goto(`/j/${id}`);

  const shortUrlId = await page.evaluate(() => window.__SHORT_URL_ID);
  expect(shortUrlId).toBe(id);
});

// ---------------------------------------------------------------------------
// Browser tests – hash params must NOT leak into the URL bar
// ---------------------------------------------------------------------------

test("short URL does not show hash params in the URL after page load", async ({
  page,
}) => {
  const { id } = await createShortUrl(
    page.request,
    'console.log("no hash leak")',
  );

  await page.goto(`/j/${id}`);

  // The hash cleanup runs asynchronously after runJsFromUrl completes,
  // so wait for it rather than just the load event.
  await page.waitForFunction(() => !window.location.hash, null, {
    timeout: 10_000,
  });

  // The URL must be the clean short URL – no hash fragment with params
  const url = new URL(page.url());
  expect(url.pathname).toBe(`/j/${id}`);
  expect(url.hash).toBe("");
});

test("window.__SHORT_URL_HASH_PARAMS is set with the original hash params", async ({
  page,
}) => {
  const { id, hashParams } = await createShortUrl(
    page.request,
    "const y = 1;",
  );

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  const storedParams = await page.evaluate(
    () => (window as any).__SHORT_URL_HASH_PARAMS,
  );
  expect(storedParams).toBeTruthy();
  // The stored params should contain the js hash param
  expect(storedParams).toContain("js=");
});

test("short URL page still executes the JS code correctly", async ({
  page,
}) => {
  // Use a script that writes visible output to the DOM
  const js = 'document.getElementById("root").textContent = "SHORT_URL_OK";';
  const { id } = await createShortUrl(page.request, js);

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  // Verify the code ran – the root element should have our text
  await expect(page.locator("#root")).toHaveText("SHORT_URL_OK", {
    timeout: 10_000,
  });

  // And the URL should still be clean
  const url = new URL(page.url());
  expect(url.pathname).toBe(`/j/${id}`);
  expect(url.hash).toBe("");
});

// ---------------------------------------------------------------------------
// API + Browser tests – inputs are preserved in short URLs
// ---------------------------------------------------------------------------

test("POST /api/shorten/json with inputs preserves them in stored hash params", async ({
  request,
}) => {
  const inputs = { greeting: { type: "utf8", value: "hello world" } };
  const body = await createShortUrl(request, "console.log(1)", { inputs });

  // Verify inputs appear in the returned hash params
  expect(body.hashParams).toContain("inputs=");

  // Fetch the stored data and verify round-trip
  const response = await request.get(`/api/j/${body.id}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  // hashParams is now a decoded JSON object
  expect(data.hashParams.inputs).toEqual(inputs);
});

test("short URL with inputs delivers them to onInputs handler", async ({
  page,
}) => {
  // JS that exports onInputs – the handler writes received inputs to the DOM
  const js = [
    'export const onInputs = (inputs) => {',
    '  document.getElementById("root").textContent = JSON.stringify(inputs);',
    '};',
  ].join("\n");
  const inputs = {
    greeting: { type: "utf8", value: "hello from short url" },
  };
  const { id } = await createShortUrl(page.request, js, { inputs });

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  // The onInputs handler should have been called with the resolved input.
  // DataRef { type: "utf8", value: "hello from short url" } resolves to "hello from short url"
  await expect(page.locator("#root")).toContainText("hello from short url", {
    timeout: 15_000,
  });
});

// ---------------------------------------------------------------------------
// API tests – default-valued hash params must NOT be stored or returned
// ---------------------------------------------------------------------------

test("POST /api/shorten/json drops a default-valued param (editorWidth=80ch)", async ({
  request,
}) => {
  const body = await createShortUrl(request, "console.log(1)", {
    editorWidth: "80ch", // 80ch is the default for editorWidth
  });

  // The default must not be persisted into the stored/returned hash params.
  expect(body.hashParams).not.toContain("editorWidth");
  expect(body.fullUrl).not.toContain("editorWidth");

  // And it must not come back in the decoded JSON representation.
  const response = await request.get(`/api/j/${body.id}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.hashParams).not.toHaveProperty("editorWidth");
});

test("POST /api/shorten/json keeps a non-default editorWidth value", async ({
  request,
}) => {
  const body = await createShortUrl(request, "console.log(1)", {
    editorWidth: "50%", // not the default → must be preserved
  });

  expect(body.hashParams).toContain("editorWidth");

  const response = await request.get(`/api/j/${body.id}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.hashParams.editorWidth).toBe("50%");
});

test("GET /api/j/:sha256 strips a default param from an already-stored URL", async ({
  request,
}) => {
  // Store a raw hash string that already contains the default (simulates URLs
  // saved before defaults were stripped at write time).
  const rawHashParams = "js=console.log(1)&editorWidth=80ch";
  const shortenResponse = await request.post("/api/shorten", {
    data: { hashParams: rawHashParams },
  });
  expect(shortenResponse.ok()).toBeTruthy();
  const { id } = await shortenResponse.json();

  // The decode endpoint must strip the default on the way out.
  const response = await request.get(`/api/j/${id}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.hashParams).not.toHaveProperty("editorWidth");
});

// ---------------------------------------------------------------------------
// Browser tests – edit button behaviour differs by short URL form
//
// There are two short URL forms with two different edit behaviours:
//
//   • sha256 (64 hex chars, minted by /api/shorten/json): backed by THIS
//     worker's S3 store. Clicking edit expands the stored hash params in place
//     and navigates to `<origin>/#...&edit=true`, exiting short-URL mode so the
//     local editor takes over. Stays on the same origin.
//
//   • uuid (8-4-4-4-12 hex, backed by framejs.app): clicking edit hands off to
//     framejs.app by opening the canonical short URL with `#?edit=true`. When
//     embedded (the production case) it uses window.open into a new tab; the
//     handoff target is a DIFFERENT origin (framejs.app) and the /j/:uuid path
//     is preserved rather than expanded.
// ---------------------------------------------------------------------------

test("sha256 short URL: clicking edit expands the hash in place on the same origin", async ({
  page,
}) => {
  // /api/shorten/json mints a sha256 short URL.
  const { id } = await createShortUrl(
    page.request,
    'document.getElementById("root").textContent = "edit test";',
  );
  expect(id).toMatch(/^[a-f0-9]{64}$/);

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  // Confirm we're on the short URL
  expect(new URL(page.url()).pathname).toBe(`/j/${id}`);

  // Click the edit button → the sha256 branch expands the stored hash params
  // in place and navigates to the root with edit=true (no framejs.app handoff).
  await page.click("#menu-button");

  await page.waitForURL(
    (url) => url.pathname === "/" && url.hash.includes("edit=true"),
    { timeout: 10_000 },
  );

  const url = new URL(page.url());
  expect(url.origin).toBe(new URL(page.url()).origin); // stayed on the worker origin
  expect(url.pathname).toBe("/");
  expect(url.hash).toContain("js=");
  expect(url.hash).toContain("edit=true");

  // The expanded URL is a fresh load at `/` — no longer in short URL mode.
  const shortUrlId = await page.evaluate(() => window.__SHORT_URL_ID);
  expect(shortUrlId).toBeUndefined();
});

test("uuid short URL: clicking edit hands off to framejs.app via window.open", async ({
  page,
}) => {
  // The test stack cannot mint a real uuid short URL page (that requires the
  // framejs.app backend, which is unreachable here). Instead we load the app
  // fully wired inside a same-origin iframe (so isIframe() is true, matching the
  // production embed) and re-point its short-URL id to a uuid. The edit handler
  // reads window.__SHORT_URL_ID at click time, so this exercises the real uuid
  // branch of onMenuClick.
  const { id } = await createShortUrl(
    page.request,
    'document.getElementById("root").textContent = "edit test";',
  );

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  const uuid = "12345678-1234-4234-8234-123456789abc";
  const uuidNoDashes = uuid.replace(/-/g, "");

  const result = await page.evaluate(
    async ({ path, uuid }) => {
      // Embed the same short-URL app in a same-origin iframe.
      const iframe = document.createElement("iframe");
      iframe.src = path;
      const loaded = new Promise<void>((res) => {
        iframe.onload = () => res();
      });
      document.body.appendChild(iframe);
      await loaded;

      const cw = iframe.contentWindow as any;

      // Wait until the iframe app has finished its short-URL init (the module
      // script awaits __SHORT_URL_READY, then sets __SHORT_URL_HASH_PARAMS).
      const start = Date.now();
      while (cw.__SHORT_URL_HASH_PARAMS === undefined) {
        if (Date.now() - start > 10_000) throw new Error("iframe app not ready");
        await new Promise((r) => setTimeout(r, 50));
      }

      // Re-point the short URL id to a uuid and capture the handoff.
      cw.__SHORT_URL_ID = uuid;
      const openCalls: string[] = [];
      cw.open = (url?: string) => {
        openCalls.push(String(url ?? ""));
        return null;
      };

      cw.document.getElementById("menu-button").click();

      return {
        openCalls,
        framejsAppOrigin: cw.__FRAMEJS_APP_ORIGIN,
        // the iframe path is preserved (uuid handoff does not expand in place)
        stillShortUrlId: cw.__SHORT_URL_ID,
      };
    },
    { path: `/j/${id}`, uuid },
  );

  // window.open was called exactly once with the framejs.app handoff URL.
  expect(result.openCalls).toHaveLength(1);
  const handoffUrl = new URL(result.openCalls[0]);
  // Handoff targets framejs.app — a DIFFERENT origin than this worker.
  expect(handoffUrl.origin).toBe(new URL(result.framejsAppOrigin).origin);
  expect(handoffUrl.origin).not.toBe(new URL(page.url()).origin);
  // Canonical short URL preserved with dashes stripped, plus #?edit=true.
  expect(handoffUrl.pathname).toBe(`/j/${uuidNoDashes}`);
  expect(handoffUrl.hash).toContain("edit=true");

  // Handoff does not exit short URL mode on the source page.
  expect(result.stillShortUrlId).toBe(uuid);
});
