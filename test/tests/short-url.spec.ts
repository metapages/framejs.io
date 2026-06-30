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
// Browser tests – edit button exits short URL mode
// ---------------------------------------------------------------------------

test("clicking edit on a short URL hands off to the editor in a new tab", async ({
  page,
}) => {
  const { id } = await createShortUrl(
    page.request,
    'document.getElementById("root").textContent = "edit test";',
  );

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");

  // Confirm we're on the short URL
  expect(new URL(page.url()).pathname).toBe(`/j/${id}`);

  // Capture window.open: in short-URL mode the edit button hands off to
  // framejs.app by opening the canonical short URL with #?edit=true in a new
  // tab (it does NOT expand the hash in place). We stub window.open because the
  // framejs.app origin is not reachable in the test stack — we only care that
  // the app *requests* the correct handoff URL.
  await page.evaluate(() => {
    window.__openCalls = [];
    window.open = (url?: string | URL) => {
      window.__openCalls!.push(String(url ?? ""));
      return null;
    };
  });

  await page.click("#menu-button");

  const openCalls = await page.evaluate(() => window.__openCalls);
  expect(openCalls).toHaveLength(1);
  const handoffUrl = new URL(openCalls![0]);
  expect(handoffUrl.pathname).toBe(`/j/${id}`);
  expect(handoffUrl.hash).toContain("edit=true");

  // The original page stays on the short URL and in short URL mode.
  expect(new URL(page.url()).pathname).toBe(`/j/${id}`);
  const shortUrlId = await page.evaluate(() => window.__SHORT_URL_ID);
  expect(shortUrlId).toBe(id);
});
