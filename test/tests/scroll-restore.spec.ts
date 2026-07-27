import { expect, test, type Page } from "@playwright/test";

/**
 * Editing code re-runs the user's JS, which wipes #root. These tests pin the
 * behaviour that the scroll position survives that re-run — both when #root
 * itself scrolls and when the scrolling element is created by the user's code
 * (the edit-mode case, where #root is overflow:hidden).
 */

// Matches @metapages/hash-query string encoding: btoa(encodeURIComponent(v)).
const encode = (value: string): string =>
  encodeURIComponent(Buffer.from(encodeURIComponent(value)).toString("base64"));

const urlForJs = (js: string) => `/#?js=${encode(js)}`;

// A frame with its own scroll container, as most frames have.
const tallFrame = (label: string, style = "") => `
const wrap = document.createElement('div');
wrap.id = 'scroller';
wrap.style.cssText = 'height:100%;overflow:auto;font-family:monospace;${style}';
for (let i = 0; i < 300; i++) {
  const d = document.createElement('div');
  d.textContent = '${label} ' + i;
  d.style.padding = '6px';
  wrap.appendChild(d);
}
root.appendChild(wrap);
`;

// What the editor's debounce does: write changed code to the hash, which the
// renderer picks up and re-runs.
const applyEdit = (page: Page, js: string) =>
  page.evaluate((hash) => {
    window.location.hash = hash;
  }, urlForJs(js).slice(1));

const expectScrollTop = (page: Page, selector: string, expected: number) =>
  expect
    .poll(
      () =>
        page.evaluate(
          (sel) => document.querySelector<HTMLElement>(sel)?.scrollTop,
          selector,
        ),
      { timeout: 6000 },
    )
    .toBe(expected);

const scrollTo = (page: Page, selector: string, top: number) =>
  page.evaluate(
    ([sel, value]) => {
      document.querySelector<HTMLElement>(sel as string)!.scrollTop =
        value as number;
    },
    [selector, top],
  );

test("restores the scroll position of a user-created scroll container", async ({
  page,
}) => {
  await page.goto(urlForJs(tallFrame("line")));
  await page.waitForSelector("#scroller");

  // Emulate the edit-mode layout, where #root cannot scroll itself.
  await page.evaluate(() => {
    document.getElementById("root")!.style.overflow = "hidden";
  });
  await scrollTo(page, "#scroller", 2000);

  await applyEdit(page, tallFrame("line "));

  await expectScrollTop(page, "#scroller", 2000);
});

test("survives a real edit typed into the editor", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(`${urlForJs(tallFrame("line"))}&edit=true`);
  await page.waitForSelector("#scroller", { timeout: 20000 });
  await scrollTo(page, "#scroller", 2000);
  const hashBefore = await page.evaluate(() => location.hash);

  // The code editor is a nested metaframe (editor.mtfm.io, Monaco).
  const monaco = page
    .frameLocator("#iframe-container iframe")
    .frameLocator("iframe")
    .locator(".monaco-editor")
    .first();
  await monaco.waitFor({ timeout: 30000 });
  await monaco.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("\n// edit");

  // The parent debounces editor changes by 400ms before writing the hash.
  await page.waitForFunction((before) => location.hash !== before, hashBefore, {
    timeout: 20000,
  });

  await expectScrollTop(page, "#scroller", 2000);
});

// The editor's debounce commonly fires while the user is still scrolling the
// output (or while trackpad momentum is still emitting wheel events). Backing
// off then would strand them at the top, since the wipe already reset it.
test("restores even when wheel events arrive while it lands", async ({
  page,
}) => {
  await page.goto(urlForJs(tallFrame("line")));
  await page.waitForSelector("#scroller");
  await scrollTo(page, "#scroller", 1487);

  // Inline rather than via applyEdit: the wheel events have to be scheduled in
  // the same tick as the hash write to land while the restore is happening.
  await page.evaluate((hash) => {
    window.location.hash = hash;
    for (let i = 0; i < 10; i++) {
      setTimeout(
        () =>
          window.dispatchEvent(
            new WheelEvent("wheel", { deltaY: 4, bubbles: true }),
          ),
        i * 20,
      );
    }
  }, urlForJs(tallFrame("line ")).slice(1));

  await expectScrollTop(page, "#scroller", 1487);
});

// Reading the DOM at wipe time is not enough: if the frame tears its own
// content down first, there is no offset left to read. The remembered one is.
test("restores from memory when the scroller is gone before the re-run", async ({
  page,
}) => {
  await page.goto(urlForJs(tallFrame("line")));
  await page.waitForSelector("#scroller");
  await scrollTo(page, "#scroller", 1487);

  // Let the scroll event reach the tracker, then destroy the scroller
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    document.getElementById("scroller")!.remove();
  });

  await applyEdit(page, tallFrame("line "));

  await expectScrollTop(page, "#scroller", 1487);
});

// An element can report plenty of content and still refuse scrollTop, because
// its overflow does not scroll. Matching by name alone writes into that element
// and silently achieves nothing; the restore has to find the box that scrolls.
test("finds the scrolling box when the re-render moves it", async ({ page }) => {
  const frame = (nested: boolean) => `
const outer = document.createElement('div');
outer.className = 'vr';
outer.style.cssText = 'height:100%;overflow:${nested ? "visible" : "auto"}';
const target = ${nested ? "document.createElement('div')" : "outer"};
${nested ? "target.className = 'vr';" : ""}
${nested ? "target.style.cssText = 'height:100%;overflow:auto';" : ""}
for (let i = 0; i < 300; i++) {
  const d = document.createElement('div');
  d.textContent = 'line ' + i;
  d.style.padding = '6px';
  target.appendChild(d);
}
${nested ? "outer.appendChild(target);" : ""}
root.appendChild(outer);
`;

  await page.goto(urlForJs(frame(false)));
  await page.waitForSelector(".vr");
  await scrollTo(page, ".vr", 3194);
  await page.waitForTimeout(100);

  // Re-render puts the scrolling box one level deeper, leaving a same-named
  // outer div that reports the content height but cannot scroll.
  await applyEdit(page, frame(true));

  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".vr")]
            .map((el) => el.scrollTop)
            .find(Boolean) ?? 0
        ),
      { timeout: 6000 },
    )
    .toBe(3194);
});

// Under `scroll-behavior: smooth`, assigning scrollTop only starts an
// animation — the read-back is the old value, and re-asserting every frame
// restarts it, pinning the element at the top forever.
test("restores through scroll-behavior: smooth", async ({ page }) => {
  const smooth = (label: string) => tallFrame(label, "scroll-behavior:smooth;");

  await page.goto(urlForJs(smooth("line")));
  await page.waitForSelector("#scroller");
  await scrollTo(page, "#scroller", 883);
  // Smooth scrolling animates, so wait for it to settle before editing
  await expectScrollTop(page, "#scroller", 883);

  await applyEdit(page, smooth("line "));

  await expectScrollTop(page, "#scroller", 883);

  // The frame's own smooth scrolling must survive the restore (put back once
  // the hold ends, so poll rather than checking immediately).
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.getElementById("scroller")!.style.scrollBehavior,
        ),
      { timeout: 5000 },
    )
    .toBe("smooth");
});

test("restores the scroll position of #root itself", async ({ page }) => {
  const js = `
for (let i = 0; i < 300; i++) {
  const d = document.createElement('div');
  d.textContent = 'row ' + i;
  d.style.padding = '6px';
  root.appendChild(d);
}
`;
  await page.goto(urlForJs(js));
  await page.waitForFunction(
    () => (document.getElementById("root")?.childElementCount ?? 0) > 100,
  );
  await scrollTo(page, "#root", 1500);

  await applyEdit(page, `${js}\n// edited`);

  await expectScrollTop(page, "#root", 1500);
});
