import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";

import {
  setHashParamValueBase64EncodedInUrl,
  setHashParamValueJsonInUrl,
} from "@metapages/hash-query";
import { expect, type Frame, type Page, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Inputs must never be lost (issue #120)
//
// A frame embedded in a metapage can be told about inputs long before it can
// do anything with them: the metaframe connects to the parent as soon as the
// page loads, but the frame's code only runs once its `modules` have loaded
// and its own module (and any top-level await) has finished. Inputs that land
// in that window must be held, then handed to `onInputs` in arrival order once
// the code is ready, exactly like inputs that arrive afterwards.
//
// The parent here is a real metapage (the @metapages/metapage library, the
// same one metapage.io uses) served from a local http server, which also
// serves a deliberately slow `modules` script to hold the frame's code back.
// ---------------------------------------------------------------------------

const METAPAGE_LIB = "https://cdn.jsdelivr.net/npm/@metapages/metapage@1.10.14";
const SLOW_MODULE_DELAY_MS = 3000;

let server: Server;
let localOrigin: string;
// The metapage definition the parent page loads, set per test.
let definition: unknown;

const PARENT_HTML = `<!doctype html>
<html>
  <body>
    <script type="module">
      import { Metapage } from "${METAPAGE_LIB}";
      const definition = await (await fetch("/definition.json")).json();
      const metapage = await Metapage.from(definition);
      window.metapage = metapage;
      for (const id of metapage.getMetaframeIds()) {
        const iframe = await metapage.getMetaframe(id).iframe;
        iframe.id = id;
        iframe.style.width = "400px";
        iframe.style.height = "200px";
        document.body.appendChild(iframe);
      }
      window.parentReady = true;
    </script>
  </body>
</html>`;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const cors = { "access-control-allow-origin": "*" };
    if (path === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(PARENT_HTML);
      return;
    }
    if (path === "/definition.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(definition));
      return;
    }
    if (path === "/plot.json") {
      res.writeHead(200, { ...cors, "content-type": "application/json" });
      res.end(JSON.stringify({ points: [4, 5, 6] }));
      return;
    }
    if (path === "/slow-plot.json") {
      setTimeout(() => {
        res.writeHead(200, { ...cors, "content-type": "application/json" });
        res.end(JSON.stringify({ version: "old" }));
      }, 1500);
      return;
    }
    if (path === "/slow-module.js") {
      setTimeout(() => {
        res.writeHead(200, {
          ...cors,
          "content-type": "application/javascript",
          "cache-control": "no-store",
        });
        res.end("window.slowModuleLoaded = true;");
      }, SLOW_MODULE_DELAY_MS);
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  localOrigin = `http://localhost:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const frameUrl = (
  baseURL: string,
  js: string,
  extra: { modules?: string[]; definition?: unknown } = {},
) => {
  let url = setHashParamValueBase64EncodedInUrl(`${baseURL}/`, "js", js);
  if (extra.modules) {
    url = setHashParamValueJsonInUrl(url, "modules", extra.modules);
  }
  if (extra.definition) {
    url = setHashParamValueJsonInUrl(url, "definition", extra.definition);
  }
  return url;
};

// Records every onInputs call, in order, so the test can check nothing was
// dropped and nothing was reordered. `slowModuleLoaded` proves the code really
// was held back by the slow module when it first ran.
const RECORDING_SINK_JS = `
window.received = [];
window.ranAfterSlowModule = !!window.slowModuleLoaded;
export const onInputs = (inputs) => {
  window.received.push(inputs);
  root.textContent = JSON.stringify(inputs);
};
`;

// A frame that publishes outputs the moment its code runs, like a job whose
// result is already cached: the downstream frame gets inputs very early.
const EAGER_SOURCE_JS = `
setOutput("plot.json", { points: [1, 2, 3] });
`;

const childFrame = async (page: Page, id: string): Promise<Frame> => {
  const handle = await page.waitForSelector(`iframe#${id}`, {
    state: "attached",
  });
  const frame = await handle.contentFrame();
  if (!frame) throw new Error(`no content frame for ${id}`);
  return frame;
};

// The values the sink has seen, per key, in the order onInputs delivered them.
const seenValues = (frame: Frame, key: string) =>
  frame.evaluate(
    (key) =>
      ((window as any).received ?? [])
        .filter((inputs: Record<string, unknown>) => key in inputs)
        .map((inputs: Record<string, unknown>) => inputs[key]),
    key,
  );

test("inputs set before a slow frame's code runs reach onInputs, in order", async ({
  page,
  baseURL,
}) => {
  definition = {
    version: "2",
    metaframes: {
      sink: {
        url: frameUrl(baseURL!, RECORDING_SINK_JS, {
          modules: [`${localOrigin}/slow-module.js`],
        }),
      },
    },
  };

  await page.goto(localOrigin);
  await page.waitForFunction(() => (window as any).parentReady);

  // Fire inputs one after another while the sink is still loading its slow
  // module, so they cannot have reached any onInputs yet.
  for (let i = 1; i <= 5; i++) {
    await page.evaluate(
      (i) => (window as any).metapage.setInputs({ sink: { count: i } }),
      i,
    );
    await page.waitForTimeout(200);
  }

  const sink = await childFrame(page, "sink");
  await expect.poll(() => seenValues(sink, "count"), { timeout: 20000 })
    .toContainEqual(5);
  expect(await sink.evaluate(() => (window as any).ranAfterSlowModule)).toBe(
    true,
  );
  // Never out of order, and the last value delivered is the latest one.
  const counts = (await seenValues(sink, "count")) as number[];
  expect([...counts].sort((a, b) => a - b)).toEqual(counts);
  expect(counts[counts.length - 1]).toBe(5);
  await expect(sink.locator("#root")).toContainText('"count":5');
});

test("an upstream output that lands while the downstream frame loads is not lost", async ({
  page,
  baseURL,
}) => {
  definition = {
    version: "2",
    metaframes: {
      source: {
        url: frameUrl(baseURL!, EAGER_SOURCE_JS, {
          definition: { outputs: { "plot.json": {} } },
        }),
      },
      sink: {
        url: frameUrl(baseURL!, RECORDING_SINK_JS, {
          modules: [`${localOrigin}/slow-module.js`],
          definition: { inputs: { "plotly.json": {} } },
        }),
        inputs: [
          { metaframe: "source", source: "plot.json", target: "plotly.json" },
        ],
      },
    },
  };

  await page.goto(localOrigin);
  await page.waitForFunction(() => (window as any).parentReady);

  const sink = await childFrame(page, "sink");
  await expect.poll(() => seenValues(sink, "plotly.json"), { timeout: 20000 })
    .toContainEqual({ points: [1, 2, 3] });
  expect(await sink.evaluate(() => (window as any).ranAfterSlowModule)).toBe(
    true,
  );
  await expect(sink.locator("#root")).toContainText('"points":[1,2,3]');
});

// Large job outputs (e.g. from container.mtfm.io) arrive as url datarefs,
// which the runtime fetches before calling onInputs. This is the shape of the
// input in the metapage the issue was reported against.
test("a url dataref input set before a slow frame's code runs reaches onInputs", async ({
  page,
  baseURL,
}) => {
  definition = {
    version: "2",
    metaframes: {
      sink: {
        url: frameUrl(baseURL!, RECORDING_SINK_JS, {
          modules: [`${localOrigin}/slow-module.js`],
        }),
      },
    },
  };

  await page.goto(localOrigin);
  await page.waitForFunction(() => (window as any).parentReady);
  await page.evaluate(
    (url) =>
      (window as any).metapage.setInputs({
        sink: { "plotly.json": { type: "url", value: url } },
      }),
    `${localOrigin}/plot.json`,
  );

  const sink = await childFrame(page, "sink");
  await expect.poll(() => seenValues(sink, "plotly.json"), { timeout: 20000 })
    .toContainEqual({ points: [4, 5, 6] });
  expect(await sink.evaluate(() => (window as any).ranAfterSlowModule)).toBe(
    true,
  );
  await expect(sink.locator("#root")).toContainText('"points":[4,5,6]');
});

// The frame's code holds itself back with a top-level await until the test
// releases it. Unlike a slow `modules` script this does not delay the page's
// load event, so the metaframe connects first and every input after that
// arrives as its own update while the code is still not ready.
const GATED_SINK_JS = `
window.received = [];
await new Promise((resolve) => { window.releaseCode = resolve; });
export const onInputs = (inputs) => {
  window.received.push(inputs);
  root.textContent = JSON.stringify(inputs);
};
`;

const loadSink = async (page: Page, js: string) => {
  definition = {
    version: "2",
    metaframes: { sink: { url: frameUrl(test.info().project.use.baseURL!, js) } },
  };
  await page.goto(localOrigin);
  await page.waitForFunction(() => (window as any).parentReady);
  const sink = await childFrame(page, "sink");
  await sink.waitForFunction(() => (window as any).metaframe);
  await sink.evaluate(() => (window as any).metaframe.connected());
  return sink;
};

test("every update that lands while the frame's code is loading is delivered, in order", async ({
  page,
}) => {
  const sink = await loadSink(page, GATED_SINK_JS);
  await sink.waitForFunction(() => (window as any).releaseCode);

  for (let i = 1; i <= 5; i++) {
    await page.evaluate(
      (i) => (window as any).metapage.setInputs({ sink: { count: i } }),
      i,
    );
  }
  // All five updates have reached the frame, none has reached onInputs.
  await expect.poll(() =>
    sink.evaluate(() => (window as any).metaframe.getInputs().count)
  ).toBe(5);
  expect(await sink.evaluate(() => (window as any).received.length)).toBe(0);

  await sink.evaluate(() => (window as any).releaseCode());

  await expect.poll(() => seenValues(sink, "count")).toEqual([1, 2, 3, 4, 5]);
  await expect(sink.locator("#root")).toContainText('"count":5');
});

// Inputs are delivered one at a time: a later update must not overtake an
// earlier one whose dataref is still being fetched, or the frame ends up
// showing the stale value.
test("a slow dataref does not let a later input overtake it", async ({
  page,
}) => {
  const sink = await loadSink(page, RECORDING_SINK_JS);
  await sink.waitForFunction(() => (window as any).received);

  await page.evaluate(
    (url) =>
      (window as any).metapage.setInputs({
        sink: { "plot.json": { type: "url", value: url } },
      }),
    `${localOrigin}/slow-plot.json`,
  );
  await page.evaluate(() =>
    (window as any).metapage.setInputs({
      sink: { "plot.json": { version: "new" } },
    })
  );

  await expect.poll(() => seenValues(sink, "plot.json"), { timeout: 10000 })
    .toEqual([{ version: "old" }, { version: "new" }]);
  await expect(sink.locator("#root")).toContainText('"version":"new"');
});

// New code replacing the running code (a hash change, an edit) starts from the
// current inputs, then keeps receiving updates.
test("code that re-runs after a hash change starts from the current inputs", async ({
  page,
  baseURL,
}) => {
  const sink = await loadSink(page, RECORDING_SINK_JS);
  await sink.waitForFunction(() => (window as any).received);
  await page.evaluate(() =>
    (window as any).metapage.setInputs({ sink: { a: 1, b: 2 } })
  );
  await expect.poll(() => seenValues(sink, "b")).toEqual([2]);

  const rerunJs = RECORDING_SINK_JS.replace(
    "window.received = [];",
    "window.received = []; window.rerun = true;",
  );
  await sink.evaluate(
    (hash) => (window.location.hash = hash),
    new URL(frameUrl(baseURL!, rerunJs)).hash,
  );
  await sink.waitForFunction(() => (window as any).rerun);

  await expect.poll(() => sink.evaluate(() => (window as any).received))
    .toEqual([{ a: 1, b: 2 }]);
  await page.evaluate(() =>
    (window as any).metapage.setInputs({ sink: { b: 3 } })
  );
  await expect.poll(() => sink.evaluate(() => (window as any).received))
    .toEqual([{ a: 1, b: 2 }, { b: 3 }]);
});
