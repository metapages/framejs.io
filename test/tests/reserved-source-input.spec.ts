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

// The other half: the editor must not write the reserved input into the urls
// it builds, and must not upload the source (it is over the inputs' upload
// threshold) only to throw the upload away.

// Well over the 200-char upload threshold for an input.
const BIG_CODE = `// ${"a long frame ".repeat(40)}\nconsole.log("big");`;

const decodeInputs = (hash: string) => {
  const match = /[#?&]inputs=([^&]*)/.exec(hash);
  if (!match) return undefined;
  return JSON.parse(decodeURIComponent(atob(decodeURIComponent(match[1]))));
};

test("copy url and snapshot drop the reserved input and upload nothing", async ({
  page,
}) => {
  // Record what the editor copies, without depending on clipboard permissions
  // inside an iframe. Runs in every frame, the editor included.
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { __copied: string[] }).__copied = copied;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          copied.push(text);
        },
      },
    });
  });

  // Any upload starts with a HEAD of /f/<sha256> or a presign request.
  const uploads: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("/api/upload") ||
      (request.method() === "HEAD" && /\/f\/[0-9a-f]{64}/.test(url))
    ) {
      uploads.push(`${request.method()} ${url}`);
    }
  });

  // Capture the snapshot instead of storing it.
  let shortenBody: { hashParams: string } | undefined;
  await page.route("**/api/shorten", async (route) => {
    shortenBody = route.request().postDataJSON();
    await route.fulfill({ json: { id: "0".repeat(64) } });
  });

  const inputs = btoa(
    encodeURIComponent(
      JSON.stringify({
        greeting: { type: "utf8", value: "hi" },
        __framejs_source: { type: "utf8", value: "" },
      }),
    ),
  );
  await page.goto(
    `/#?edit=true&inputs=${inputs}&js=${btoa(encodeURIComponent(BIG_CODE))}`,
  );
  await page.waitForLoadState("load");

  const editor = editorFrame(page);
  await expect(
    editor.frameLocator("iframe").locator(".monaco-editor .view-lines").first(),
  ).toContainText("a long frame", { timeout: 20_000 });

  // Copy URL
  await editor.locator('[aria-label="copy url"]').click();
  const editorHandle = page.frame({ url: /\/editor\// })!;
  await expect
    .poll(() =>
      editorHandle.evaluate(
        () => (window as unknown as { __copied: string[] }).__copied.length,
      ), { timeout: 10_000 })
    .toBeGreaterThan(0);
  const copiedUrl = await editorHandle.evaluate(
    () => (window as unknown as { __copied: string[] }).__copied[0],
  );
  // Only the frame's own input survives. (Its exact encoding is the
  // conversion's business, not this test's.)
  expect(Object.keys(decodeInputs(copiedUrl) ?? {})).toEqual(["greeting"]);

  // Create expiring snapshot (the same builder as standalone export)
  await editor.locator('[aria-label="create expiring snapshot"]').click();
  await expect.poll(() => shortenBody, { timeout: 10_000 }).toBeDefined();
  expect(
    Object.keys(decodeInputs(`#?${shortenBody!.hashParams}`) ?? {}),
  ).toEqual(["greeting"]);

  expect(uploads).toEqual([]);
});
