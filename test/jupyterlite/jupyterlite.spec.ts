// The JupyterLite demo in the docs (/docs/integrations/jupyterlite), end to end.
//
// It broke twice at once, invisibly, with nothing testing it:
//
//   1. The bundle. examples/jupyterlite/requirements.txt let `notebook` float to
//      7.6 against a jupyterlite-core built for Notebook 7.3. Its lab-extension
//      was federated into the older host, and the page rendered BLANK with only
//      a console error ("The getter for the shared module is not a function",
//      shareKey @jupyterlab/docregistry). → "the notebook UI loads".
//   2. The notebook. It called MetaframeWidget.from_code(), removed from
//      metaframe-widget in July. → the traceback check below.
//
// The second test also asserts data reaches the charts INSIDE the widgets, not
// just that an <iframe> appeared — an iframe appearing is what the Jupyter tests
// used to check, and it stayed true while widgets were deaf (a framed
// framejs.app /j/<uuid> URL relays the metapage protocol only since the embed
// wrapper learned to; see framejs-nhost lib/embedFrame.ts METAPAGE_RELAY_JS).
import { expect, type Page, test } from "@playwright/test";

const NOTEBOOK = "/notebooks/index.html?path=metaframe_demo.ipynb";

// The two charts' frames, as referenced by examples/jupyterlite/content/metaframe_demo.ipynb.
const CHART_IDS = [
  "f500b0bdbe8d4a1690803014bc9ac918", // Wave Components
  "c41de55053a645c6b417ef639a8de588", // Combined Signal
];

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test("the notebook UI loads (federated extensions agree with the host)", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(NOTEBOOK);

  // A federation mismatch leaves an empty page: no notebook, no cells.
  await expect(page.locator(".jp-Notebook .jp-Cell").first()).toBeVisible({
    timeout: 60_000,
  });
  expect(await page.locator(".jp-Notebook .jp-CodeCell").count())
    .toBeGreaterThanOrEqual(5);
  await expect(page.getByText("Python (Pyodide)").first()).toBeVisible();

  expect(
    errors.filter((m) => /shared module|RUNTIME-\d+|federat/i.test(m)),
  ).toEqual([]);
});

test("running the demo draws data inside both widgets", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(NOTEBOOK);
  await expect(page.locator(".jp-Notebook .jp-CodeCell").first()).toBeVisible({
    timeout: 60_000,
  });

  await page.locator(".lm-MenuBar-item", { hasText: "Run" }).click();
  await page.locator(".lm-Menu-item", {
    has: page.locator(".lm-Menu-itemLabel", { hasText: /^Run All Cells$/ }),
  }).click();

  // The last code cell prints this once Python has pushed data to both widgets.
  // Presence, not visibility, throughout: Notebook 7 windows off-screen cells,
  // so a rendered output scrolled out of view does not count as "visible".
  await expect(
    page.locator(".jp-OutputArea-output", {
      hasText: "Sent 600 data points with 4 wave components",
    }),
  ).toHaveCount(1, { timeout: 200_000 });

  // No cell may have raised (a removed API, a failed %pip install, ...).
  for (const text of await page.locator(".jp-OutputArea-output").allInnerTexts()) {
    expect(text).not.toMatch(/Traceback|Error:/);
  }

  // Both widgets rendered...
  for (const id of CHART_IDS) {
    await expect(
      page.locator(`.jp-OutputArea-output iframe[src*="/j/${id}"]`),
    ).toHaveCount(1);
  }

  // ...and the data Python sent actually arrived: Plotly drew traces inside the
  // framejs.io runtime frame nested in each widget.
  for (const id of CHART_IDS) {
    await expect
      .poll(
        async () => {
          // The wrapper and the runtime frame both carry /j/<id>; ask each and
          // keep the best answer rather than guess which host is which.
          const counts = await Promise.all(
            page.frames()
              .filter((f) => f.url().includes(`/j/${id}`))
              .map((f) =>
                f.evaluate(() =>
                  document.querySelectorAll(".scatterlayer .trace").length
                ).catch(() => 0)
              ),
          );
          return Math.max(0, ...counts);
        },
        { timeout: 60_000, message: `chart ${id} never drew the data` },
      )
      .toBeGreaterThan(0);
  }

  expect(errors.filter((m) => /shared module|RUNTIME-\d+/i.test(m))).toEqual([]);
});
