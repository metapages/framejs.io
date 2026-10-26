// The editor must open WITH the frame's code even when the browser still has
// the previous editor build cached. metapages/framejs.io#115
//
// The runtime page (/) always comes from the network, but the editor (/editor/)
// is served by its own precaching service worker. A browser only notices a new
// editor deploy while serving the old one, so the first edit after a deploy
// ran the OLD editor inside the NEW runtime. When the source moved from the
// editor's url to a postMessage input, that old editor opened with an empty
// buffer; closing and editing again (now on the updated worker) showed the
// code.
//
// The dev stack serves the editor from Vite with no service worker, so the two
// builds are stood in for by two versions of one service-worker script under
// /editor/: "before the deploy" answers every editor navigation with a stub
// page, "after the deploy" passes through to the real editor. The editor must
// be the real one on the FIRST open.
//
// The script is a real file in editor/public (served live by Vite through the
// compose bind mount), because the "deploy" has to be seen by the browser's own
// service-worker update check — and that fetch is made where neither
// page/context.route nor CDP Fetch interception can reach it. So this spec
// needs the local dev stack, as `just _integration-test` runs it.
import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Gitignored (editor/public/__test-*), and removed after the test.
const SW_NAME = "__test-stale-editor-sw.js";
const SW_FILE = fileURLToPath(
  new URL(`../../editor/public/${SW_NAME}`, import.meta.url),
);

const CODE = 'document.getElementById("root").textContent = "stale-sw-115";';
const JS_PARAM = btoa(encodeURIComponent(CODE));

const ACTIVATE_NOW = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
`;

// The previously deployed editor build, as far as this test is concerned: an
// editor that never shows the code.
const SW_BEFORE_DEPLOY = `// editor build: before deploy
${ACTIVATE_NOW}
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(new Response(
    '<!doctype html><div id="stale-editor">previous editor build</div>',
    { headers: { "content-type": "text/html" } },
  ));
});
`;

// The current build: no fetch handler, so the real editor from the network.
const SW_AFTER_DEPLOY = `// editor build: after deploy
${ACTIVATE_NOW}
`;

// A newer build that takes longer to install than the runtime's 10 s bound
// (a big precache on a bad network). Before, the runtime gave up waiting at
// 10 s and loaded the previous build; now it must keep the editor back until
// this one is active. Then it is the current build: no fetch handler.
const SW_SLOW_INSTALL = `// editor build: slow install
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(new Promise((resolve) => setTimeout(resolve, 15000)));
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
`;

test.afterEach(async ({ page }) => {
  await page
    .evaluate(async () => {
      for (const reg of await navigator.serviceWorker.getRegistrations()) {
        await reg.unregister();
      }
    })
    .catch(() => {});
  fs.rmSync(SW_FILE, { force: true });
});

// An earlier visit installed the previous editor build's worker, and it is
// active for /editor/ on this page's origin.
async function installPreviousEditorBuild(page: Page) {
  fs.writeFileSync(SW_FILE, SW_BEFORE_DEPLOY);

  await page.goto(`/#?js=${JS_PARAM}`);
  await page.waitForLoadState("load");
  await expect(page.locator("#root")).toHaveText("stale-sw-115", {
    timeout: 20_000,
  });

  await page.evaluate(async (swName) => {
    const reg = await navigator.serviceWorker.register(`/editor/${swName}`, {
      scope: "/editor/",
    });
    const sw = reg.installing || reg.waiting || reg.active;
    if (sw && sw.state !== "activated") {
      await new Promise<void>((resolve) =>
        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") resolve();
        }),
      );
    }
  }, SW_NAME);
}

// Open the editor once, and require the CURRENT editor with the frame's code:
// never the previous build's page.
async function expectFirstOpenShowsCode(
  page: Page,
  { alreadyClicked = false } = {},
) {
  if (!alreadyClicked) await page.locator("#menu-button").click();

  const editor = page.frameLocator("#iframe-container iframe");
  await expect(editor.locator('[aria-label="save frame"]')).toBeVisible({
    timeout: 30_000,
  });
  await expect(editor.locator("#stale-editor")).toHaveCount(0);
  await expect(
    editor.frameLocator("iframe").locator(".view-lines").first(),
  ).toContainText("stale-sw-115", { timeout: 30_000 });
}

test("the first editor open after an editor deploy shows the code", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await installPreviousEditorBuild(page);

  // Since then a new editor has been deployed.
  fs.writeFileSync(SW_FILE, SW_AFTER_DEPLOY);

  await expectFirstOpenShowsCode(page);
});

test("a new editor worker slower than the 10 s bound delays the editor, never falls back to the old build", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await installPreviousEditorBuild(page);

  fs.writeFileSync(SW_FILE, SW_SLOW_INSTALL);

  await page.locator("#menu-button").click();
  // While it waits, the pane says so — and the old build never loads.
  await expect(page.locator("#editor-loading")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator("#iframe-container")).toHaveCount(0);
  await page.waitForTimeout(11_000);
  await expect(page.locator("#iframe-container")).toHaveCount(0);

  await expectFirstOpenShowsCode(page, { alreadyClicked: true });
});

test("when the editor worker cannot be checked, the cached build is bypassed", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await installPreviousEditorBuild(page);

  // update() rejects: the worker script 404s.
  fs.rmSync(SW_FILE, { force: true });

  await expectFirstOpenShowsCode(page);
});
