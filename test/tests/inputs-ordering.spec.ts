import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";

import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// onInputs is called in the order the inputs arrived
//
// Handling an input update in the runtime is asynchronous: a url DataRef is
// fetched, and smart unpacking parses blobs. Inputs arrive as independent
// postMessage events from the parent metapage, so two updates in quick
// succession raced each other: a slow one (a url DataRef that has to be
// fetched) called the frame's onInputs *after* a later fast one, and the frame
// was left showing a stale value for good.
//
// This drives the real thing: a parent page speaking the metapage protocol
// sends two updates to the same input, back to back. The first points at a
// deliberately slow url, the second is a plain string. The frame records every
// value it is handed, so the recorded order is the assertion.
//
// The parent page is served from the local http server rather than being an
// about:blank page with injected content: an opaque-origin page counts as
// public, and Chrome's Local Network Access checks then block it from loading
// the frame off the local stack at all (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS).
// ---------------------------------------------------------------------------

/** How long the slow input's url takes to answer */
const SLOW_RESPONSE_MS = 600;
const SLOW_BODY = "SLOW";
const FAST_VALUE = "LATEST";

let server: Server;
let localOrigin: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    // The frame is served from an https origin, so this is a cross-origin
    // read: it has to opt in, including Chrome's Private Network Access
    // preflight header. http://localhost is "potentially trustworthy", so it
    // is not blocked as mixed content.
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-allow-private-network": "true",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/parent.html") {
      res.writeHead(200, { ...cors, "content-type": "text/html" });
      res.end("<!doctype html><html><body></body></html>");
      return;
    }
    if (path === "/slow.txt") {
      setTimeout(() => {
        res.writeHead(200, { ...cors, "content-type": "text/plain" });
        res.end(SLOW_BODY);
      }, SLOW_RESPONSE_MS);
      return;
    }
    res.writeHead(404, cors);
    res.end("not found");
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  localOrigin = `http://localhost:${port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// Records every value of the `v` input, in the order onInputs is called with
// them. "ready" tells the test the module is running and listening.
const RECORD_INPUT_ORDER_JS = [
  "const received = [];",
  'const el = document.getElementById("root");',
  'el.textContent = "ready";',
  "export const onInputs = (inputs) => {",
  "  if (!inputs || inputs.v === undefined) {",
  "    return;",
  "  }",
  "  received.push(String(inputs.v));",
  '  el.textContent = received.join(",");',
  "};",
].join("\n");

async function createShortUrl(
  request: import("@playwright/test").APIRequestContext,
  js: string,
) {
  const response = await request.post("/api/shorten/json", { data: { js } });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{ id: string }>;
}

/**
 * Embed the frame and act as its parent metapage: answer its registration
 * request, then send `updates` as InputsUpdate messages, back to back, as soon
 * as it has registered.
 *
 * Only the handful of protocol messages the runtime needs are implemented
 * here: using a real Metapage would need the metapage library in this page,
 * and the point is to control the exact timing of two messages.
 */
const FAKE_METAPAGE = (args: {
  frameUrl: string;
  frameName: string;
  parentId: string;
  updates: { [key: string]: any }[];
}) => {
  const { frameUrl, frameName, parentId, updates } = args;
  const iframe = document.createElement("iframe");
  iframe.name = frameName;
  iframe.style.width = "600px";
  iframe.style.height = "400px";

  const send = (method: string, params: any) => {
    iframe.contentWindow?.postMessage(
      {
        jsonrpc: "2.0",
        id: "_",
        method,
        params,
        iframeId: frameName,
        parentId,
      },
      "*",
    );
  };

  window.addEventListener("message", (e: MessageEvent) => {
    const message = e.data;
    if (!message || message.jsonrpc !== "2.0") {
      return;
    }
    if (message.method === "SetupIframeClientRequest") {
      send("SetupIframeServerResponse", {
        iframeId: frameName,
        parentId,
        state: { inputs: {} },
        version: "v2",
      });
      return;
    }
    if (message.method === "SetupIframeServerResponseAck") {
      (window as any).__frameRegistered = true;
    }
  });

  (window as any).__sendInputs = () => {
    // Back to back, in this order, with nothing awaited in between: this is
    // the race
    for (const inputs of updates) {
      send("InputsUpdate", { inputs, parentId });
    }
  };

  // The frame's own retry covers a request sent before this listener existed
  iframe.src = frameUrl;
  document.body.appendChild(iframe);
};

test("a slow input does not overwrite the input that came after it", async ({
  page,
  baseURL,
}) => {
  const { id } = await createShortUrl(page.request, RECORD_INPUT_ORDER_JS);
  const frameUrl = `${baseURL}/j/${id}`;

  await page.goto(`${localOrigin}/parent.html`);
  await page.evaluate(FAKE_METAPAGE, {
    frameUrl,
    frameName: "frame1",
    parentId: "test-parent",
    updates: [
      { v: { type: "url", value: `${localOrigin}/slow.txt` } },
      { v: FAST_VALUE },
    ],
  });

  const root = page.frameLocator("iframe").locator("#root");
  // Wait until the frame's module is running and listening, otherwise the
  // inputs are merged before it starts and delivered as a single value
  await expect(root).toHaveText("ready", { timeout: 30_000 });
  await page.waitForFunction(() => (window as any).__frameRegistered === true, {
    timeout: 30_000,
  });

  await page.evaluate(() => (window as any).__sendInputs());

  // Both values, in the order they were sent. Unqueued, the fast one arrives
  // first and the slow one lands on top of it: "LATEST,SLOW".
  await expect(root).toHaveText(`${SLOW_BODY},${FAST_VALUE}`, {
    timeout: 30_000,
  });

  // And it stays that way: nothing else is still in flight
  await page.waitForTimeout(SLOW_RESPONSE_MS);
  await expect(root).toHaveText(`${SLOW_BODY},${FAST_VALUE}`);
});
