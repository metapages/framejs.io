// A frame that writes to document.body must stay editable.
//
// #root is one of four siblings in <body> — the Edit button, #root, the editor
// pane, the resize handle — so `document.body.innerHTML = …` in frame code
// deletes the runtime along with whatever it replaced. The frame still renders,
// so this is invisible until someone clicks Edit and gets nothing, at which
// point the frame can no longer be fixed from its own page. Frame code is told
// not to do it (and framejs.app's MCP tools reject code that does), but the
// runtime recovers anyway: see guardRuntimeChrome() in worker/index.html.
import { expect, test } from "@playwright/test";

const jsParam = (code: string) => btoa(encodeURIComponent(code));

// The editor pane lives at /editor/ inside the runtime.
const EDITOR_IFRAME = "#iframe-container";

test("a frame that replaces document.body can still be edited", async ({
  page,
}) => {
  const code = `document.body.innerHTML = '<div id="in-body">body content</div>';`;
  await page.goto(`/#?js=${jsParam(code)}`);
  await page.waitForLoadState("load");

  // The frame's (misplaced) content is there — this is the state users see and
  // report as working.
  await expect(page.locator("#in-body")).toHaveText("body content");

  // The chrome the body write deleted has been put back.
  await expect(page.locator("#menu-button")).toHaveCount(1);
  await expect(page.locator("#root")).toHaveCount(1);
  await expect(page.locator("#editor-root")).toHaveCount(1);

  // And Edit does what it is for: opens the editor.
  await page.locator("#menu-button").click();
  await expect(page.locator(EDITOR_IFRAME)).toHaveCount(1, { timeout: 20_000 });
  expect(await page.evaluate(() => window.location.hash)).toContain(
    "edit=true",
  );
});

test("the restored empty #root does not swallow clicks on body content", async ({
  page,
}) => {
  // #root is a full-size transparent box. Restored, it is also empty and sits
  // over the frame's body-level content, so it has to be click-through or the
  // frame looks right and responds to nothing.
  const code = [
    "const b = document.createElement('button');",
    "b.id = 'in-body';",
    "b.textContent = 'click me';",
    "b.onclick = () => { b.textContent = 'clicked'; };",
    "document.body.innerHTML = '';",
    "document.body.appendChild(b);",
  ].join("\n");
  await page.goto(`/#?js=${jsParam(code)}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#root")).toHaveAttribute(
    "data-chrome-restored",
    "true",
  );
  await expect(page.locator("#root")).toHaveCSS("pointer-events", "none");

  await page.locator("#in-body").click();
  await expect(page.locator("#in-body")).toHaveText("clicked");
});

test("a frame that appends to the body keeps its Edit button working", async ({
  page,
}) => {
  // The milder mistake: nothing is deleted, but the appended node is outside
  // #root, so the runtime never clears it. The Edit button must still work —
  // and here it was never removed, so this is the regression guard that the
  // recovery path has not broken the ordinary case.
  const code = [
    "root.innerHTML = '<p id=\"in-root\">in root</p>';",
    "const extra = document.createElement('div');",
    "extra.id = 'appended';",
    "document.body.appendChild(extra);",
  ].join("\n");
  await page.goto(`/#?js=${jsParam(code)}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#in-root")).toHaveText("in root");
  await expect(page.locator("#appended")).toHaveCount(1);
  // #root kept its content, so it is not marked click-through.
  await expect(page.locator("#root")).not.toHaveAttribute(
    "data-chrome-restored",
    "true",
  );

  await page.locator("#menu-button").click();
  await expect(page.locator(EDITOR_IFRAME)).toHaveCount(1, { timeout: 20_000 });
});

test("an ordinary frame is untouched by the guard", async ({ page }) => {
  const code = `root.innerHTML = '<h1 id="title">ordinary</h1>';`;
  await page.goto(`/#?js=${jsParam(code)}`);
  await page.waitForLoadState("load");

  await expect(page.locator("#title")).toHaveText("ordinary");
  await expect(page.locator("#root")).not.toHaveAttribute(
    "data-chrome-restored",
    "true",
  );
  await expect(page.locator("#root")).toHaveCSS("pointer-events", "auto");
  await page.locator("#menu-button").click();
  await expect(page.locator(EDITOR_IFRAME)).toHaveCount(1, { timeout: 20_000 });
});
