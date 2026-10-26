// The landing page — what `/` shows when the url carries no code.
//
// It is its own lazily-imported module (worker/static/landing.js), not markup
// inside the runtime, and its "Edit" button is the one thing in the header that
// says this page is itself a frame you can edit: it seeds a starter frame into
// `js` and opens the editor pane on it.
import { expect, test } from "@playwright/test";

test("the landing header offers Edit beside the framejs.app link", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("load");

  const bar = page.locator(".landing-app-bar");
  await expect(bar).toBeVisible();

  // Exactly two controls, Edit first: it sits to the LEFT of the app link,
  // which is the far-right one. toHaveText over the list asserts count AND
  // order, and retries — the landing is revealed asynchronously, and a
  // one-shot read of it can land while it is still hidden.
  await expect(bar.locator(".lab-actions a, .lab-actions button"))
    .toHaveText([/^\s*Edit\s*$/, /^\s*Open framejs\.app →\s*$/]);
});

test("Edit seeds a starter frame and opens the editor on it", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("load");

  expect(await page.evaluate(() => window.location.hash)).not.toContain("js=");

  await page.locator("#landing-edit-button").click();

  // The pane is open...
  await expect(page.locator("#iframe-container")).toHaveCount(1, {
    timeout: 20_000,
  });

  // ...on a frame that is now in the url, in edit mode.
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toContain("js=");
  expect(hash).toContain("edit=true");

  // The starter frame renders something, ONCE. The `js` write is deliberately a
  // self-write (history.replaceState) so it does not re-run the frame on top of
  // the run mountEditor does itself; a second run would append a second copy.
  await expect(page.locator("#root h1")).toHaveCount(1, { timeout: 20_000 });
  await expect(page.locator("#root h1")).toHaveText("Hello, framejs");

  // And it carries the rest of the API as commented-out blocks to uncomment.
  const source = await page.evaluate(() => {
    const match = /(?:^|[#?&])js=([^&]*)/.exec(window.location.hash);
    return match ? decodeURIComponent(atob(match[1])) : "";
  });
  for (const commented of [
    "// setJson(",
    "// export const onInputs",
    "// setOutputs(",
    "// export const onResize",
    "// export const cleanup",
    "// import * as d3",
  ]) {
    expect(source).toContain(commented);
  }
});


// The starter frame's own "Back" button: the frame IS the hash params, so
// dropping them is what takes you back to the front page.
test("the starter frame's Back button returns to the base route", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.locator("#landing-edit-button").click();
  await expect(page.locator("#root h1")).toHaveText("Hello, framejs", {
    timeout: 20_000,
  });

  await page.locator("#root button", { hasText: "Back" }).click();
  await page.waitForLoadState("load");

  // Base route, no params left, landing back.
  expect(new URL(page.url()).pathname).toBe("/");
  expect(await page.evaluate(() => window.location.hash)).toBe("");
  await expect(page.locator("#landing-edit-button")).toBeVisible({
    timeout: 20_000,
  });
});

// The landing is a separate module so that the runtime — which every frame
// downloads — does not carry it. A frame load must therefore never fetch it.
test("a frame load does not fetch the landing module", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));

  const js = btoa(encodeURIComponent('root.innerHTML = "<h2>a frame</h2>";'));
  await page.goto(`/#?js=${js}`);
  await page.waitForLoadState("load");
  await expect(page.locator("#root h2")).toHaveText("a frame");

  expect(requested.filter((url) => url.includes("landing.js"))).toEqual([]);

  // ...and the landing page does fetch it (so the check above can't pass by
  // looking for the wrong name).
  await page.goto("/");
  await expect(page.locator("#landing-edit-button")).toBeVisible();
  expect(requested.filter((url) => url.includes("landing.js"))).toHaveLength(1);
});
