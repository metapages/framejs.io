// "Embed File" in the editor: the file is uploaded, added to `inputs`, and an
// upload comment is injected into the code — two changes from one action, that
// reach the page on two channels (the editor's hash, and the source output).
//
// Regression: the runtime debounced both into one write but let the later one
// rebuild the whole hash on its own, so the code's write (built from a page
// hash with no input yet) replaced the one carrying the input. The upload
// succeeded and the frame never received the file.
import { expect, test } from "@playwright/test";

const CODE =
  'export const onInputs = (i) => { root.innerText = "inputs=" + Object.keys(i).join(","); };';

test("an embedded file reaches the frame as an input", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(`/#?edit=true&js=${btoa(encodeURIComponent(CODE))}`);
  const editor = page.frameLocator("#iframe-container iframe");
  const fileInput = editor.locator('input[type="file"]');
  await expect(fileInput).toHaveCount(1, { timeout: 30_000 });
  // Let the editor seed its buffer from the runtime first.
  await expect(editor.locator(".monaco-editor, iframe").first()).toBeAttached({
    timeout: 30_000,
  });

  const name = `embed-${Date.now()}.csv`;
  await fileInput.setInputFiles({
    name,
    mimeType: "text/csv",
    buffer: Buffer.from(`a,b\n1,${Date.now()}\n`),
  });

  await expect(page.locator("#root")).toHaveText(`inputs=${name}`, {
    timeout: 30_000,
  });
  // Both halves of the action landed in the page url.
  await expect.poll(() => page.evaluate(() => location.hash)).toContain(
    "inputs=",
  );
  await expect.poll(() => page.evaluate(() => location.hash)).toContain("js=");
});
