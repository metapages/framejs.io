// The editor pane receives the frame's source on a reserved metaframe input,
// `__framejs_source` (see editor/src/utils/frameSource.ts). Older editors
// leaked that input into the saved `inputs` hash param, usually as an empty
// string. The runtime forwards every input update to the editor, so the leaked
// copy overwrote the real source and the pane opened with NO CODE.
// metapages/framejs.io#146
import { expect, test } from "@playwright/test";

const CODE = "// sdfsdfsdfsdf";
const JS_PARAM = btoa(encodeURIComponent(CODE));
const INPUTS_PARAM = btoa(
  encodeURIComponent(
    JSON.stringify({ __framejs_source: { type: "utf8", value: "" } }),
  ),
);

const editorFrame = (page: import("@playwright/test").Page) =>
  page.frameLocator("#iframe-container iframe");

test("a leaked __framejs_source input does not blank the editor", async ({
  page,
}) => {
  // The url from the issue: an empty leaked source in `inputs`, real `js`.
  await page.goto(
    `/#?edit=true&editorWidth=45vw&inputs=${INPUTS_PARAM}&js=${JS_PARAM}`,
  );
  await page.waitForLoadState("load");

  await expect(page.locator("#iframe-container")).toHaveCount(1, {
    timeout: 20_000,
  });
  const monacoLines = editorFrame(page).frameLocator("iframe").locator(
    ".monaco-editor .view-lines",
  ).first();
  await expect(monacoLines).toContainText("sdfsdfsdfsdf", { timeout: 20_000 });
});
