// worker/index.html is the runtime shell: the one file every frame downloads.
//
// It must not contain a framejs.app URL. The server injects the configured
// origin as window.__FRAMEJS_APP_ORIGIN and everything that needs the account
// app reads that (the runtime, the editor iframe via window.parent, the landing
// module). It used to ALSO rewrite every "https://framejs.app" literal in the
// body with a blanket string replacement, for the landing markup that was
// inline there; that markup is its own module now and the rewrite is gone — so
// a URL literal that creeps back in would no longer be rewritten, and would
// quietly point a dev or preview stack at production.
//
// Prose is fine: the comments in that file explain a lot by naming framejs.app,
// and this only looks for URLs.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, it } from "vitest";

// Resolved from the working directory, not import.meta.url: these tests run in
// the jsdom environment, where import.meta.url is an http URL and
// fileURLToPath throws on it. `npm run test:unit` runs from test/.
const INDEX_HTML = ["../worker/index.html", "worker/index.html"]
  .map((path) => resolve(process.cwd(), path))
  .find(existsSync);

// https://framejs.app, http://framejs.app, //framejs.app — and any subdomain.
// No `g` flag: `test` is stateful with one, and this runs per line.
const APP_URL = /(?:https?:)?\/\/(?:[\w-]+\.)*framejs\.app/i;

it("the runtime shell has no framejs.app URL in it", () => {
  expect(INDEX_HTML, "worker/index.html not found").toBeDefined();
  const lines = readFileSync(INDEX_HTML!, "utf8").split("\n");

  const offenders = lines
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => APP_URL.test(line))
    .map(({ line, number }) => `  worker/index.html:${number}: ${line.trim()}`);

  expect(
    offenders,
    "Use window.__FRAMEJS_APP_ORIGIN (injected by buildIndexHtml in " +
      "worker/server.ts) instead of a hard-coded origin; markup that belongs " +
      "to the landing page goes in worker/static/landing.js:\n" +
      offenders.join("\n"),
  ).toEqual([]);
});
