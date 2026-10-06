import { expect, test } from "@playwright/test";

// Integration tests for two changes to how a short-URL page is served:
//
//  1. The hash params are FETCHED, never inlined into the HTML. `/j/:uuid` used
//     to inline them, which put a large frame's whole payload inside a
//     `Cache-Control: no-cache` document — re-sent on every load and on every
//     crawler/unfurl of the link. The sha256 page had fetched from the start;
//     the two are now one code path (`shortUrlInitScript`).
//  2. The page's og metadata comes from an og-ONLY source, so rendering a page
//     no longer resolves the frame's content at all. For sha256 that is the
//     `og/<sha256>` sidecar written beside the blob at shorten time; for uuid
//     it is framejs.app's `/j/<uuid>/og.json`. Before, a megabyte-class frame
//     was resolved twice per page load to produce ~200 bytes of markup.
//
// The payload here is deliberately large so "is it in the HTML?" is unambiguous:
// a ~400 KB source encodes to ~1 MB of hash param, which would dwarf the
// runtime shell if it were inlined.

const BIG_JS_BYTES = 400_000;
const bigJs = (marker: string) =>
  `// ${marker}\n` + `// ${"x".repeat(BIG_JS_BYTES)}\n` +
  `document.getElementById("root").innerHTML =` +
  `'<h1 id="probe">${marker}</h1>';`;

async function shorten(
  request: import("@playwright/test").APIRequestContext,
  body: Record<string, unknown>,
) {
  const response = await request.post("/api/shorten/json", { data: body });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{ id: string }>;
}

test("a large frame's params are not inlined into the page", async ({
  request,
}) => {
  const js = bigJs("NOT-INLINED");
  const { id } = await shorten(request, { js });

  const page = await request.get(`/j/${id}`);
  expect(page.ok()).toBeTruthy();
  const html = await page.text();

  // The payload must be absent from the document...
  expect(html).not.toContain("x".repeat(1000));
  // ...and the page must be far smaller than the content it renders.
  expect(html.length).toBeLessThan(js.length);
  // ...with the params assigned from a fetch instead.
  expect(html).toContain("runtime-params");
  expect(html).toContain("window.__SHORT_URL_HASH_PARAMS=p");

  // The init script must not inline a params STRING. (Its catch assigns an
  // empty one deliberately, so only a non-empty literal is a regression.)
  const inlined = /__SHORT_URL_HASH_PARAMS\s*=\s*(["'])(?!\1)/.test(html);
  expect(inlined).toBe(false);
});

test("the page carries og meta tags without resolving the content", async ({
  request,
}) => {
  const og = { title: "Sidecar Title", description: "from the og source" };
  const { id } = await shorten(request, { js: bigJs("OG-TAGS"), og });

  const html = await (await request.get(`/j/${id}`)).text();

  expect(html).toContain(`content="${og.title}"`);
  expect(html).toContain(`content="${og.description}"`);
  // Still no payload: the og came from the sidecar, not from decoding the blob.
  expect(html).not.toContain("x".repeat(1000));
});

test("an og-less frame still serves a page", async ({ request }) => {
  // The sidecar is written even with no og data, so its presence can stand in
  // for "this frame exists". A frame with no og must therefore still render —
  // with the site's default tags and no per-frame favicon link.
  const { id } = await shorten(request, { js: 'console.log("no og")' });

  const page = await request.get(`/j/${id}`);
  expect(page.ok()).toBeTruthy();
  const html = await page.text();
  expect(html).toContain("runtime-params");
  expect(html).not.toContain(`/j/${id}/favicon.png`);
});

test("runtime-params serves the params, immutably for a sha256", async ({
  request,
}) => {
  const js = 'console.log("runtime params")';
  const { id } = await shorten(request, { js });

  const response = await request.get(`/api/j/${id}/runtime-params`);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("text/plain");
  // Content-addressed, so these params can never change.
  expect(response.headers()["cache-control"]).toContain("immutable");

  const params = await response.text();
  expect(params.startsWith("?")).toBe(true);
  expect(params).toContain("js=");
});

test("runtime-params strips `edit` so a load cannot exit short-URL mode", async ({
  request,
}) => {
  // A stored `edit=true` would make the page navigate straight back out to the
  // expanded hash URL. The page handler used to strip it before inlining;
  // now that the browser fetches the params, the endpoint has to do it.
  const { id } = await shorten(request, {
    js: 'console.log("edit stripped")',
    edit: true,
  });

  const params = await (await request.get(`/api/j/${id}/runtime-params`))
    .text();
  expect(params).not.toContain("edit=");
});

test("runtime-params rejects a malformed id and 404s an unknown one", async ({
  request,
}) => {
  expect((await request.get("/api/j/not-a-real-id/runtime-params")).status())
    .toBe(400);
  expect(
    (await request.get(`/api/j/${"b".repeat(64)}/runtime-params`)).status(),
  ).toBe(404);
});

test("an unknown sha256 page 404s instead of serving a shell", async ({
  request,
}) => {
  // The sidecar is the page's existence check on the fast path, so a miss must
  // fall through to the blob and 404 — never render an empty runtime.
  const response = await request.get(`/j/${"c".repeat(64)}`);
  expect(response.status()).toBe(404);
});

test("a large frame still runs from fetched params", async ({ page }) => {
  // The whole point: the page got smaller without the frame getting broken.
  const marker = "BIG-FRAME-RAN";
  const response = await page.request.post("/api/shorten/json", {
    data: { js: bigJs(marker) },
  });
  const { id } = await response.json() as { id: string };

  await page.goto(`/j/${id}`);
  await expect(page.locator("#probe")).toHaveText(marker);

  // The params arrived over the network, not from the document.
  const paramsLen = await page.evaluate(() =>
    (window as unknown as { __SHORT_URL_HASH_PARAMS?: string })
      .__SHORT_URL_HASH_PARAMS?.length ?? 0
  );
  expect(paramsLen).toBeGreaterThan(1000);
});
