import { expect, type Page, test } from "@playwright/test";

/**
 * `getJson(key)` / `saveJson(key, value)` are the core URL-state API: globals a
 * frame uses to persist its own state into the URL. These tests pin the three
 * promises the docs make about them —
 *
 *  1. the value round-trips through the URL,
 *  2. `saveJson` declares the key in `definition.hashParams` itself, so the
 *     state is not stripped on save / shorten / copy, and
 *  3. saving does NOT re-run the frame (in-memory state and the DOM survive).
 */

declare global {
  interface Window {
    __runs: number;
    __getJson: (key: string) => unknown;
    __saveJson: (key: string, value: unknown) => void;
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
window.__saveJson = saveJson;
`;

const load = async (page: Page) => {
  await page.goto(urlForJs(frame));
  await page.waitForLoadState("load");
  await expect.poll(() => page.evaluate(() => window.__runs)).toBe(1);
};

test("saveJson round-trips a value through the URL", async ({ page }) => {
  await load(page);

  await page.evaluate(() => window.__saveJson("state", { zoom: 2 }));

  expect(await hashParam(page, "state")).toEqual({ zoom: 2 });
  expect(await page.evaluate(() => window.__getJson("state"))).toEqual({
    zoom: 2,
  });

  // Falsy JSON values are values, not deletes.
  await page.evaluate(() => window.__saveJson("state", 0));
  expect(await page.evaluate(() => window.__getJson("state"))).toBe(0);

  // undefined removes it.
  await page.evaluate(() => window.__saveJson("state", undefined));
  expect(await hashParam(page, "state")).toBeUndefined();
  expect(await page.evaluate(() => window.__getJson("state"))).toBeUndefined();
});

test("saveJson declares the key in definition.hashParams", async ({ page }) => {
  await load(page);

  expect(await hashParam(page, "definition")).toBeUndefined();

  await page.evaluate(() => window.__saveJson("state", { zoom: 2 }));

  expect(await hashParam(page, "definition")).toMatchObject({
    hashParams: { state: { type: "json" } },
  });
});

test("saveJson does not re-run the frame", async ({ page }) => {
  await load(page);

  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.__saveJson("state", { zoom: i });
  });

  // Give a re-run a chance to happen before asserting it did not.
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__runs)).toBe(1);
  expect(await page.locator("#root").textContent()).toBe("runs: 1");
});

test("on a short URL, getJson reads the stored value and saveJson updates it", async ({
  page,
  request,
}) => {
  // A short URL keeps its params server-side, so getJson must read them from
  // there rather than from the address bar — and a later saveJson goes onto
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

  await page.evaluate(() => window.__saveJson("state", { zoom: 8 }));
  expect(await hashParam(page, "state")).toEqual({ zoom: 8 });
  expect(await page.evaluate(() => window.__getJson("state"))).toEqual({
    zoom: 8,
  });
  // The key is already declared in the stored definition, so nothing was
  // expanded onto the URL for it.
  expect(await hashParam(page, "definition")).toBeUndefined();
});

test("saveJson rejects a reserved hash param", async ({ page }) => {
  await load(page);

  const error = await page.evaluate(() => {
    try {
      window.__saveJson("js", { nope: true });
      return null;
    } catch (err) {
      return (err as Error).message;
    }
  });
  expect(error).toContain("reserved");
});
