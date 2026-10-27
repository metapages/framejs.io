// Standalone HTML export (POST /api/export/html, GET /html/:sha256): one frame
// baked into a single .html file that runs with ZERO network requests.
//
// The proof is the last step of each test: the downloaded file is opened from
// disk with every non-file request aborted, and the frame still renders its
// code, its npm import, its stylesheet module and its url input.
//
// Needs internet access from the worker (esm.sh / jsdelivr), like the frames.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

// Exercises every kind of thing the export pulls in: an esm.sh import, a css
// module (and the font urls inside it), a classic-script module, an import map
// and a url-dataref input.
const CODE = `
import { sum } from "https://esm.sh/d3-array@3.2.4";
import confetti from "canvas-confetti";
root.innerHTML = '<h1 id="sum">sum=' + sum([1, 2, 3]) + '</h1>'
  + '<p id="confetti">' + typeof confetti + '</p>'
  + '<p id="classic">' + typeof window.Mustache + '</p>';
export const onInputs = (inputs) => {
  if (inputs["pkg.json"]) {
    root.insertAdjacentHTML("beforeend",
      '<p id="input">' + inputs["pkg.json"].name + '</p>');
  }
};
`;

const MODULES = [
  JSON.stringify({
    imports: {
      "canvas-confetti":
        "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm",
    },
  }),
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/400.css",
  "https://cdn.jsdelivr.net/npm/mustache@4.2.0/mustache.min.js",
];

const INPUTS = {
  "pkg.json": {
    type: "url",
    value: "https://cdn.jsdelivr.net/npm/d3-array@3.2.4/package.json",
  },
};

// The hash-param string the editor would send, encoded by the server itself.
async function hashParamsFor(
  request: APIRequestContext,
  frame: Record<string, unknown>,
): Promise<string> {
  const response = await request.post("/api/shorten/json", { data: frame });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).hashParams;
}

async function exportHtml(request: APIRequestContext, hashParams: string) {
  const response = await request.post("/api/export/html", {
    data: { hashParams },
    timeout: 120_000,
  });
  return {
    status: response.status(),
    body: await response.json(),
  };
}

// Opens a file with the network cut off; returns what it tried to fetch.
async function openOffline(page: Page, path: string): Promise<string[]> {
  const attempted: string[] = [];
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (/^(file|data|blob):/.test(url)) return route.continue();
    attempted.push(url);
    return route.abort();
  });
  await page.goto(`file://${path}`);
  return attempted;
}

test("exports a frame to one html file that runs with no network", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const hashParams = await hashParamsFor(request, {
    js: CODE,
    modules: MODULES,
    inputs: INPUTS,
    og: { title: "Standalone test" },
  });

  const first = await exportHtml(request, hashParams);
  expect(first.status, JSON.stringify(first.body)).toBe(200);
  expect(first.body.id).toMatch(/^[a-f0-9]{64}$/);
  expect(first.body.path).toBe(`/html/${first.body.id}`);

  // Content-addressed: the same frame is the same file, and is not re-uploaded.
  const second = await exportHtml(request, hashParams);
  expect(second.body.id).toBe(first.body.id);
  expect(second.body.existed).toBe(true);

  const download = await request.get(first.body.path);
  expect(download.ok()).toBeTruthy();
  expect(download.headers()["content-disposition"]).toContain("attachment");
  const bytes = await download.body();
  expect(bytes.byteLength).toBe(first.body.size);
  const html = bytes.toString("utf8");
  // The original, un-bundled source is kept readable inside the file.
  expect(html).toContain('id="framejs-original"');
  expect(html).toContain("<title>Standalone test</title>");

  const path = join(mkdtempSync(join(tmpdir(), "framejs-export-")), "f.html");
  writeFileSync(path, html);
  const attempted = await openOffline(page, path);

  await expect(page.locator("#sum")).toHaveText("sum=6", { timeout: 20_000 });
  await expect(page.locator("#confetti")).toHaveText("function");
  await expect(page.locator("#classic")).toHaveText("object");
  await expect(page.locator("#input").last()).toHaveText("d3-array");
  // The css module was applied (its @font-face is inline).
  expect(
    await page.evaluate(() =>
      [...document.styleSheets].some((s) =>
        [...s.cssRules].some((r) => r.cssText.includes("Inter"))
      )
    ),
  ).toBe(true);
  // The menu button is gone: there is no editor in the file.
  await expect(page.locator("#menu-button")).toBeHidden();

  expect(attempted).toEqual([]);
});

test("export rejects bad requests with a reason", async ({ request }) => {
  const missing = await request.post("/api/export/html", { data: {} });
  expect(missing.status()).toBe(400);

  const unresolvable = await exportHtml(
    request,
    await hashParamsFor(request, { js: 'import x from "not-mapped";\nx();' }),
  );
  expect(unresolvable.status).toBe(422);
  expect(unresolvable.body.error).toContain('"not-mapped"');

  // A public name for a private address (wildcard DNS) is refused, not
  // fetched: the export must never read the server's own network.
  const ssrf = await exportHtml(
    request,
    await hashParamsFor(request, {
      js: "root.innerText = 1;",
      inputs: { x: { type: "url", value: "http://127.0.0.1.nip.io:8333/" } },
    }),
  );
  expect(ssrf.status).toBe(422);
  expect(ssrf.body.error).toContain("non-public address");

  const notFound = await request.get(`/html/${"0".repeat(64)}`);
  expect(notFound.status()).toBe(404);
  const invalid = await request.get("/html/nope");
  expect(invalid.status()).toBe(400);
});

test("the editor header button downloads the export", async ({ page }) => {
  test.setTimeout(180_000);
  const js = btoa(
    encodeURIComponent(
      'root.innerHTML = "<h1 id=hello>hello from the editor</h1>";',
    ),
  );
  await page.goto(`/#?js=${js}&edit=true`);
  const editor = page.frameLocator("#iframe-container iframe");
  const button = editor.locator('[data-testid="export-html-button"]');
  await expect(button).toBeVisible({ timeout: 30_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 120_000 }),
    button.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^framejs-[a-f0-9]{12}\.html$/);
  // download.path() has no extension, and file:// needs .html to render it.
  const path = join(
    mkdtempSync(join(tmpdir(), "framejs-export-")),
    download.suggestedFilename(),
  );
  await download.saveAs(path);

  const offline = await page.context().newPage();
  const attempted = await openOffline(offline, path);
  await expect(offline.locator("#hello")).toHaveText("hello from the editor", {
    timeout: 20_000,
  });
  expect(attempted).toEqual([]);
});
