import { expect, test } from "@playwright/test";

// The "Open in framejs" export an external app adds (docs/ai/export-from-your-app.md,
// worker/static/skill/framejs/references/export-from-your-app.md): a page on
// SOME OTHER origin builds a frame and POSTs it to framejs.io. These run that
// page on a fake origin so the CORS behaviour the recipe relies on is real.
// Chrome's Local Network Access check blocks a page on a route-fulfilled origin
// from fetching the local stack under test (production framejs.io is never a
// local address), so the permission is granted up front.

const EXTERNAL_APP = "https://external-app.localhost/";

test.use({ permissions: ["local-network-access"] });

test.beforeEach(async ({ page }) => {
  await page.route(EXTERNAL_APP, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>external app</title><p>my app</p>",
    })
  );
  await page.goto(EXTERNAL_APP);
});

test("POST /api/frame is readable cross-origin and rejects a frame without js", async ({ page, baseURL }) => {
  const result = await page.evaluate(async (api) => {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame: { og: { title: "no code" } } }),
    });
    return { status: res.status, body: await res.json() };
  }, `${baseURL}/api/frame`);

  expect(result.status).toBe(400);
  expect(result.body.error).toContain("missing js");
});

test("POST /api/frame rejects a body with neither frame nor hashParams", async ({ request }) => {
  const res = await request.post("/api/frame", { data: {} });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toContain("frame or hashParams");
});

test("POST /api/frame rejects an id that is not a uuid instead of minting a new frame", async ({ request }) => {
  const res = await request.post("/api/frame", {
    data: { frame: { js: "root.innerHTML = 'x'" }, id: "not-a-uuid" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toContain("`id` must be the uuid");
});

test("an exported frame (inlined bundle + payload input) renders in the runtime", async ({ page, baseURL }) => {
  // What the recipe's "inlined" variant produces: the app's bundle verbatim,
  // then mounting code that draws the payload delivered through onInputs.
  const bundle = `export function drawPayload(host, payload) {
  host.textContent = "drew " + payload.name + " with " + payload.nodes.length + " nodes";
}`;
  const js = `${bundle}

root.innerHTML = "";
const host = document.createElement("div");
host.style.cssText = "width:100%;height:100%;";
root.appendChild(host);

export function onInputs(inputs) {
  if (inputs["payload.json"]) drawPayload(host, inputs["payload.json"]);
}`;

  const shortUrl = await page.evaluate(
    async ({ api, frame }) => {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(frame),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).shortUrl as string;
    },
    {
      api: `${baseURL}/api/shorten/json`,
      frame: {
        js,
        inputs: { "payload.json": { name: "tyk2", nodes: [1, 2, 3] } },
        og: { title: "tyk2", description: "Shared from external app" },
      },
    },
  );

  await page.goto(new URL(shortUrl).pathname);
  await expect(page.locator("#root")).toHaveText("drew tyk2 with 3 nodes", {
    timeout: 15_000,
  });
});
