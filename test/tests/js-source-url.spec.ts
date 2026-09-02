import { expect, test } from "@playwright/test";

// A `js` hash param whose value is a single-line http(s) URL is a REFERENCE to
// the frame's source, not the source itself: the renderer fetches that URL and
// runs what comes back. Same rule as the `css` param (see css-hash-param.spec.ts).
//
// This exists because a frame's code normally travels inline in the URL, and
// Chrome refuses to navigate to a URL over 2MiB — a large frame embedded by
// hash URL lands on about:blank#blocked and renders blank. framejs.app hoists an
// oversize frame's source into storage and stores `js=<https://…/f/<id>>`.
//
// The load-bearing invariant is the second test: the reference must never be
// expanded back onto window.location.hash. The embedder watches that URL to
// decide when to save a new version, and a frame using setJson rewrites it on
// every interaction — expanding would hand back the whole source each time.

// Matches @metapages/hash-query string encoding: btoa(encodeURIComponent(v)).
const encode = (value: string): string => btoa(encodeURIComponent(value));

const SOURCE_URL = "https://files.example.com/f/frame-source.js";

const SOURCE = `document.getElementById("root").innerHTML =
  '<p id="from-url">loaded from a url</p>';`;

/** Serve `body` at SOURCE_URL, CORS-open like the real /f/<id> route. */
async function serveSource(page: import("@playwright/test").Page, body: string) {
  await page.route(SOURCE_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      headers: { "access-control-allow-origin": "*" },
      body,
    }),
  );
}

test("a js param that is a URL runs the source fetched from it", async ({
  page,
}) => {
  await serveSource(page, SOURCE);

  await page.goto(`/#?js=${encode(SOURCE_URL)}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#from-url")).toHaveText("loaded from a url", {
    timeout: 10_000,
  });
});

test("the reference is not expanded onto the page URL", async ({ page }) => {
  await serveSource(page, SOURCE);

  await page.goto(`/#?js=${encode(SOURCE_URL)}`);
  await page.waitForLoadState("load");
  await expect(page.locator("#from-url")).toHaveCount(1, { timeout: 10_000 });

  // The hash still carries the encoded URL, not the fetched source. This is
  // what keeps a hoisted frame's URL small for the embedder.
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toContain(`js=${encode(SOURCE_URL)}`);
  expect(hash).not.toContain(encode(SOURCE));
});

test("inline js is still run verbatim, not treated as a URL", async ({
  page,
}) => {
  const inline = `document.getElementById("root").innerHTML =
    '<p id="inline">inline</p>';`;

  await page.goto(`/#?js=${encode(inline)}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#inline")).toHaveText("inline", {
    timeout: 10_000,
  });
});

test("a failed fetch reports an error instead of breaking the page", async ({
  page,
}) => {
  await page.route(SOURCE_URL, (route) =>
    route.fulfill({ status: 404, body: "nope" }),
  );

  await page.goto(`/#?js=${encode(SOURCE_URL)}`);
  await page.waitForLoadState("load");

  // The page survives: chrome is intact and no user content was rendered.
  await expect(page.locator("#root")).toHaveCount(1);
  await expect(page.locator("#from-url")).toHaveCount(0);
});
