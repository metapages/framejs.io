import { expect, type Page, test } from "@playwright/test";

/**
 * `getJson(key)` / `setJson(key, value)` are the core URL-state API: globals a
 * frame uses to persist its own state into the URL. These tests pin the three
 * promises the docs make about them —
 *
 *  1. the value round-trips through the URL,
 *  2. `setJson` declares the key in `definition.hashParams` itself, so the
 *     state is not stripped on save / shorten / copy, and
 *  3. saving does NOT re-run the frame (in-memory state and the DOM survive),
 *  4. saving is not delivered to the frame's own `hashchange` listeners, so a
 *     frame that re-renders on `hashchange` does not re-render over its own
 *     save — which used to yank focus out of the input being typed into.
 *
 * `saveJson` is a kept alias of `setJson`; the last test pins that.
 */

declare global {
  interface Window {
    __runs: number;
    __getJson: (key: string) => unknown;
    __setJson: (key: string, value: unknown) => void;
    __saveJson: (key: string, value: unknown) => void;
    __hashEvents: number;
  }
}

// Matches @metapages/hash-query string encoding: btoa(encodeURIComponent(v)).
const encode = (value: string): string =>
  encodeURIComponent(Buffer.from(encodeURIComponent(value)).toString("base64"));

const urlForJs = (js: string) => `/#?js=${encode(js)}`;

const decodeParam = (value: string): unknown =>
  JSON.parse(
    decodeURIComponent(
      Buffer.from(decodeURIComponent(value), "base64").toString("utf8"),
    ),
  );

// The decoded value of one hash param of the page's current URL.
const hashParam = async (page: Page, key: string): Promise<unknown> => {
  const hash = await page.evaluate(() => window.location.hash);
  const raw = hash.replace(/^#\??/, "");
  for (const pair of raw.split("&")) {
    const eq = pair.indexOf("=");
    if (eq !== -1 && pair.substring(0, eq) === key) {
      return decodeParam(pair.substring(eq + 1));
    }
  }
  return undefined;
};

// A frame that counts its own runs and exposes the API to the test.
const frame = `
window.__runs = (window.__runs || 0) + 1;
root.textContent = 'runs: ' + window.__runs;
window.__getJson = getJson;
window.__setJson = setJson;
window.__saveJson = saveJson;
`;

const load = async (page: Page) => {
  await page.goto(urlForJs(frame));
  await page.waitForLoadState("load");
  await expect.poll(() => page.evaluate(() => window.__runs)).toBe(1);
};

test("setJson round-trips a value through the URL", async ({ page }) => {
  await load(page);

  await page.evaluate(() => window.__setJson("state", { zoom: 2 }));

  expect(await hashParam(page, "state")).toEqual({ zoom: 2 });
  expect(await page.evaluate(() => window.__getJson("state"))).toEqual({
    zoom: 2,
  });

  // Falsy JSON values are values, not deletes.
  await page.evaluate(() => window.__setJson("state", 0));
  expect(await page.evaluate(() => window.__getJson("state"))).toBe(0);

  // undefined removes it.
  await page.evaluate(() => window.__setJson("state", undefined));
  expect(await hashParam(page, "state")).toBeUndefined();
  expect(await page.evaluate(() => window.__getJson("state"))).toBeUndefined();
});

test("setJson declares the key in definition.hashParams", async ({ page }) => {
  await load(page);

  expect(await hashParam(page, "definition")).toBeUndefined();

  await page.evaluate(() => window.__setJson("state", { zoom: 2 }));

  expect(await hashParam(page, "definition")).toMatchObject({
    hashParams: { state: { type: "json" } },
  });
});

test("setJson does not re-run the frame", async ({ page }) => {
  await load(page);

  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.__setJson("state", { zoom: i });
  });

  // Give a re-run a chance to happen before asserting it did not.
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__runs)).toBe(1);
  expect(await page.locator("#root").textContent()).toBe("runs: 1");
});

test("on a short URL, getJson reads the stored value and setJson updates it", async ({
  page,
  request,
}) => {
  // A short URL keeps its params server-side, so getJson must read them from
  // there rather than from the address bar — and a later setJson goes onto
  // the URL, where it overrides the stored value.
  const response = await request.post("/api/shorten/json", {
    data: {
      js: frame,
      state: { zoom: 7 },
      definition: { version: "1", hashParams: { state: { type: "json" } } },
    },
  });
  expect(response.ok()).toBeTruthy();
  const { id } = await response.json();

  await page.goto(`/j/${id}`);
  await page.waitForLoadState("load");
  await expect.poll(() => page.evaluate(() => window.__runs)).toBe(1);

  // Read from the stored params — nothing is on the address bar yet.
  expect(await page.evaluate(() => window.location.hash)).toBe("");
  expect(await page.evaluate(() => window.__getJson("state"))).toEqual({
    zoom: 7,
  });

  await page.evaluate(() => window.__setJson("state", { zoom: 8 }));
  expect(await hashParam(page, "state")).toEqual({ zoom: 8 });
  expect(await page.evaluate(() => window.__getJson("state"))).toEqual({
    zoom: 8,
  });
  // The key is already declared in the stored definition, so nothing was
  // expanded onto the URL for it.
  expect(await hashParam(page, "definition")).toBeUndefined();
});

test("setJson rejects a reserved hash param", async ({ page }) => {
  await load(page);

  const error = await page.evaluate(() => {
    try {
      window.__setJson("js", { nope: true });
      return null;
    } catch (err) {
      return (err as Error).message;
    }
  });
  expect(error).toContain("reserved");
});

test("saveJson is an alias of setJson", async ({ page }) => {
  await load(page);

  await page.evaluate(() => window.__saveJson("state", { zoom: 3 }));

  expect(await hashParam(page, "state")).toEqual({ zoom: 3 });
  expect(await page.evaluate(() => window.__getJson("state"))).toEqual({
    zoom: 3,
  });
  expect(await hashParam(page, "definition")).toMatchObject({
    hashParams: { state: { type: "json" } },
  });

  // Errors name the alias the frame actually called.
  const error = await page.evaluate(() => {
    try {
      window.__saveJson("js", { nope: true });
      return null;
    } catch (err) {
      return (err as Error).message;
    }
  });
  expect(error).toContain("saveJson:");
});


// A frame that persists state AND re-renders on `hashchange` — a very natural
// pairing ("the url changed, load my state from it") and the one that used to
// break. `setJson` announced itself with a window-wide synthetic event, the
// frame could not tell it from an external edit, and rebuilt its DOM out from
// under the input the user was typing in.
const rerenderingFrame = `
window.__hashEvents = 0;
window.__setJson = setJson;
const draw = () => {
  const state = getJson('state');
  root.innerHTML = '<input id="field" value="' + ((state && state.text) || '') + '">';
};
window.addEventListener('hashchange', () => {
  window.__hashEvents++;
  draw();
});
draw();
`;

const loadRerendering = async (page: Page) => {
  await page.goto(urlForJs(rerenderingFrame));
  await page.waitForLoadState("load");
  await expect.poll(() => page.locator("#field").count()).toBe(1);
};

test("setJson is not delivered to the frame's own hashchange listener", async ({
  page,
}) => {
  await loadRerendering(page);

  await page.locator("#field").click();
  await page.keyboard.type("hello");

  // Exactly what a debounced autosave does after the user stops typing.
  await page.evaluate(() => window.__setJson("state", { text: "hello" }));

  // Give a stray event a chance to arrive before asserting it did not.
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => window.__hashEvents)).toBe(0);
  // The decisive one: same element, still focused, still holding what was typed.
  // A re-render would have replaced the input and blanked both.
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("field");
  expect(await page.locator("#field").inputValue()).toBe("hello");
});

test("a genuine external hash change still reaches the frame", async ({
  page,
}) => {
  await loadRerendering(page);

  // `hm` only decides whether the frame's own edit button shows, so it is a
  // NON_EXECUTION_PARAM: a real external hash change that must be delivered to
  // the frame without re-running its JS (a re-run would reset the counter).
  await page.evaluate(() => {
    globalThis.location.hash = globalThis.location.hash + "&hm=disabled";
  });

  await expect.poll(() => page.evaluate(() => window.__hashEvents))
    .toBeGreaterThanOrEqual(1);
});
