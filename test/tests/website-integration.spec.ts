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

test("the docs' template runs a live frame fetched cross-origin from /j/<uuid>.json", async ({ page, baseURL, request }) => {
  // Creating and reading back a frame goes through the stack to framejs.app
  test.setTimeout(60_000);
  const res = await request.post("/api/frame", {
    data: {
      frame: {
        js: `root.innerHTML = '<p id="live"></p>';
export function onInputs(inputs) { document.getElementById("live").textContent = "live " + inputs.word; }`,
        inputs: { word: "hello" },
      },
    },
  });
  expect(res.ok()).toBe(true);
  const { id } = await res.json();

  await servePost(page, `${baseURL}/j/${id}.json`);
  await page.goto(`${BLOG}/post`);

  await expect(page.locator("#root #live")).toHaveText("live hello", { timeout: 30_000 });
  await expect(page.locator("iframe")).toHaveCount(0);
});
