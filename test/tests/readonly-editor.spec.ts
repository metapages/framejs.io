// `readonly=true` — the code pane opens to be READ, never edited.
//
// Set by the worker on a published version (`/j/<uuid>?v=<sha256>`, immutable)
// and by framejs.app's frame page when it embeds one. Those paths need a
// framejs.app backend, which the test stack has no access to, so the flag is
// exercised here the way any embedder sets it: straight on the hash.
import { expect, test } from "@playwright/test";

// `document.getElementById("root").textContent = "readonly"` — base64 of the
// URI-encoded source, the form the runtime's `js` param takes.
const CODE = 'document.getElementById("root").textContent = "readonly";';
const JS_PARAM = btoa(encodeURIComponent(CODE));

// The editor pane lives at /editor/ inside the runtime; the Monaco buffer
// itself is a further iframe from editor.mtfm.io.
const editorFrame = (page: import("@playwright/test").Page) =>
  page.frameLocator('#iframe-container iframe');

test("readonly=true opens the code pane locked, and says so", async ({
  page,
}) => {
  await page.goto(`/#?js=${JS_PARAM}&edit=true&readonly=true`);
  await page.waitForLoadState("load");

  // The pane is open...
  await expect(page.locator("#iframe-container")).toHaveCount(1, {
    timeout: 20_000,
  });

  // ...carrying the badge. This is the whole point: a locked editor with no
  // explanation reads as broken.
  const badge = editorFrame(page).locator('[data-testid="read-only-badge"]');
  await expect(badge).toBeVisible({ timeout: 20_000 });

  // Actions that would write the code are gone, not merely disabled. (The
  // editable case below asserts the same control IS there without the flag, so
  // this can't pass by matching nothing.)
  await expect(editorFrame(page).locator('[aria-label="save frame"]'))
    .toHaveCount(0);

  // Monaco itself refuses the keystroke, so the hash never moves.
  const before = await page.evaluate(() => window.location.hash);
  const monaco = editorFrame(page).frameLocator("iframe").locator(
    ".monaco-editor",
  ).first();
  await monaco.click({ timeout: 20_000 });
  await page.keyboard.type("XXX_SHOULD_NOT_APPEAR");
  // Long enough for the editor's commit debounce (800ms) plus the runtime's
  // own 400ms hash write, had either fired.
  await page.waitForTimeout(3_000);
  expect(await page.evaluate(() => window.location.hash)).toBe(before);
  expect(await page.evaluate(() => window.location.hash)).not.toContain(
    btoa("XXX").slice(0, 3),
  );
});

test("without readonly the same pane is editable", async ({ page }) => {
  await page.goto(`/#?js=${JS_PARAM}&edit=true`);
  await page.waitForLoadState("load");

  await expect(page.locator("#iframe-container")).toHaveCount(1, {
    timeout: 20_000,
  });
  await expect(editorFrame(page).locator('[data-testid="read-only-badge"]'))
    .toHaveCount(0);
  await expect(editorFrame(page).locator('[aria-label="save frame"]'))
    .toBeVisible({ timeout: 20_000 });
});
