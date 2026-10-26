import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

// The "Website Integration" runner (docs/integrations/website.md, kept identical
// to worker/static/skill/framejs/references/website-integration.md by
// scripts/validate-skill.mjs): plain HTML a site pastes in to run a frame's
// code in its own page, with no iframe and no framejs.io runtime page. These
// serve the docs' template, verbatim, from a fake blog origin.
// Chrome's Local Network Access check blocks a page on a route-fulfilled origin
// from fetching the local stack under test, so the permission is granted up front.
// Nothing here writes to the stack (see MISSING_FRAME below).

const BLOG = "https://blog.localhost";
const PLACEHOLDER = '"https://framejs.io/j/<uuid>.json"';

const docs = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../docs/integrations/website.md"),
  "utf8",
);
const template = docs.match(/^```html\n([\s\S]*?)^```$/m)![1];

test.use({ permissions: ["local-network-access"] });

// A blog post with the template pasted into it, loading the frame from `source`.
const servePost = async (page, source: string) => {
  expect(template).toContain(PLACEHOLDER);
  await page.route(`${BLOG}/post`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>my post</title>
<h1>My post</h1>
<script>
  window.__outputs = [];
  addEventListener("framejs-outputs", (e) => window.__outputs.push(e.detail), true);
</script>
${template.replace(PLACEHOLDER, JSON.stringify(source))}
<p>The end.</p>`,
    })
  );
};

test("the docs' template runs a frame in the page: modules, inputs, state, outputs, resize", async ({ page }) => {
  const js = `
root.innerHTML = '<p id="drawn" class="from-module"></p><p id="size"></p>';
const zoom = getJson("state").zoom;
setJson("state", { zoom: zoom + 1 });
export function onInputs(inputs) {
  document.getElementById("drawn").textContent =
    inputs.name + " " + inputs["data.json"].points.length + " zoom " + getJson("state").zoom +
    " lib " + window.fromScriptModule;
  setOutput("drew", inputs.name);
}
export function onResize(width) {
  document.getElementById("size").textContent = "w" + Math.round(width);
}`;
  await page.route(`${BLOG}/frame.json`, (route) =>
    route.fulfill({
      json: {
        js,
        inputs: {
          name: "tyk2",
          "data.json": { type: "url", value: `${BLOG}/data` },
        },
        modules: [`${BLOG}/lib.css`, `${BLOG}/lib.js`],
        state: { zoom: 3 },
      },
    })
  );
  await page.route(`${BLOG}/data`, (route) =>
    route.fulfill({ contentType: "application/json", body: '{"points":[1,2,3]}' })
  );
  await page.route(`${BLOG}/lib.css`, (route) =>
    route.fulfill({ contentType: "text/css", body: ".from-module { color: rgb(255, 0, 0); }" })
  );
  await page.route(`${BLOG}/lib.js`, (route) =>
    route.fulfill({ contentType: "text/javascript", body: "window.fromScriptModule = 'ok';" })
  );
  await servePost(page, "./frame.json");

  await page.goto(`${BLOG}/post`);

  const drawn = page.locator("#root #drawn");
  await expect(drawn).toHaveText("tyk2 3 zoom 4 lib ok", { timeout: 15_000 });
  await expect(drawn).toHaveCSS("color", "rgb(255, 0, 0)");
  await expect(page.locator("#root #size")).toHaveText(/^w\d+$/);
  // Part of the page itself: no iframe, the URL left alone
  await expect(page.locator("h1")).toHaveText("My post");
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(page.url()).toBe(`${BLOG}/post`);
  expect(await page.evaluate(() => (window as any).__outputs)).toEqual([{ drew: "tyk2" }]);
});

// Read-only on purpose: /api/frame would write a frame to the stack's
// FRAMEJS_APP_ORIGIN, which defaults to production framejs.app. A frame id that
// does not exist exercises the same cross-origin /j/<uuid>.json proxy (its
// error responses carry the CORS header too) and the template's error path.
const MISSING_FRAME = "00000000000000000000000000000000";

test("/j/<uuid>.json is readable cross-origin, and the template explains a frame that fails to load", async ({ page, baseURL, request }) => {
  const res = await request.get(`/j/${MISSING_FRAME}.json`, {
    headers: { Origin: BLOG },
  });
  expect(res.status()).toBe(404);
  expect(res.headers()["access-control-allow-origin"]).toBe("*");

  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const source = `${baseURL}/j/${MISSING_FRAME}.json`;
  await servePost(page, source);
  await page.goto(`${BLOG}/post`);

  // An HTTP status, not a TypeError: the page could read the cross-origin response
  await expect(page.locator("#root")).toHaveText(`framejs: could not load ${source} (HTTP 404)`, {
    timeout: 15_000,
  });
  expect(errors.join("\n")).toContain("HTTP 404");
});

test("the template explains a frame with no js", async ({ page }) => {
  await page.route(`${BLOG}/frame.json`, (route) => route.fulfill({ json: { inputs: {} } }));
  await servePost(page, "./frame.json");
  await page.goto(`${BLOG}/post`);
  await expect(page.locator("#root")).toHaveText("framejs: frame has no js");
});

test("onInputs is not called for a frame without inputs, as in the runtime", async ({ page }) => {
  const js = `root.innerHTML = '<p id="ran">ran</p>';
export function onInputs() { document.getElementById("ran").textContent = "onInputs called"; }`;
  await page.route(`${BLOG}/frame.json`, (route) => route.fulfill({ json: { js } }));
  await servePost(page, "./frame.json");
  await page.goto(`${BLOG}/post`);
  await expect(page.locator("#root #ran")).toHaveText("ran");
  await page.waitForTimeout(300);
  await expect(page.locator("#root #ran")).toHaveText("ran");
});
