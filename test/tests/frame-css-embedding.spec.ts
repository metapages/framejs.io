import { readFileSync } from "node:fs";
import {
  expect,
  type Frame,
  type Page,
  test,
} from "@playwright/test";

// frame.css (https://framejs.app/frame.css) is the stylesheet frames link to
// look like framejs. It is authored for a document the frame owns
// (`html, body { height: 100% }`, `body { background: var(--paper) }`), yet
// frames are also run IN-PAGE by third-party embedders (a blog runs the frame's
// module against a div it owns, so the app's height just flows). The in-page
// embedding contract (docs/guide/embedding.md) says what such an embedder keeps
// and drops; this suite pins both sides of it:
//
//   - a change made for in-page embedding must not alter how frames already
//     render on framejs.io (paths 1–4: top-level hash URL, short URL, inside an
//     iframe, and with the transient `css` param), and
//   - an embedder that follows the contract (path 5) gets a frame that sits on
//     the page's ground, keeps the page's box, and follows the page's theme.
//
// Fixtures are three frame shapes, because they fail differently: `shell` (a
// `.frame` with the component classes), `full-bleed` (a canvas filling root,
// no `.frame` — nothing to carry a ground) and `bare` (a plain <p> that only
// inherits from body).
//
// Assertions are computed values, not pixels: they are what actually broke,
// and they don't flake on the IBM Plex font swap.
//
// frame.css is served by framejs.app (the framejs-nhost repo), not this one.
//   FRAME_CSS_URL   the stylesheet under test (default: FRAMEJS_APP_ORIGIN/frame.css)
//   FRAME_CSS_FILE  serve this local file AT that URL instead — test a
//                   frame.css edit before deploying it

const FRAME_CSS_URL = process.env.FRAME_CSS_URL ??
  `${process.env.FRAMEJS_APP_ORIGIN ?? "https://framejs.app"}/frame.css`;
const FRAME_CSS_FILE = process.env.FRAME_CSS_FILE;

// frame.css palette tokens, as computed colours. Pinned literally rather than
// read from frame.css, so "body's ground is unchanged" means unchanged: a
// palette retune in framejs-nhost (frame.css lives there) breaks this suite on
// purpose — update these values in the same breath.
const PALETTE = {
  light: { paper: "rgb(244, 243, 239)", ink: "rgb(17, 17, 16)" },
  dark: { paper: "rgb(19, 19, 17)", ink: "rgb(238, 236, 229)" },
} as const;
const TRANSPARENT = "rgba(0, 0, 0, 0)";

type Scheme = "light" | "dark";
type Theme = Scheme | undefined; // data-theme on the host; undefined = absent
type FixtureName = "shell" | "full-bleed" | "bare";

const FIXTURES: Record<FixtureName, string> = {
  shell: `<div class="frame" data-fixture="shell">
  <h1>Shell</h1>
  <div class="plate" style="padding: 1rem">
    <p>Plate text</p>
    <input class="field" value="field" />
    <button class="btn btn-primary">Go</button>
    <button class="btn btn-secondary">Cancel</button>
  </div>
</div>`,
  "full-bleed": `<canvas data-fixture="full-bleed" style="display: block; width: 100%; height: 100%"></canvas>`,
  bare: `<p data-fixture="bare">Bare paragraph</p>`,
};
const FIXTURE_NAMES = Object.keys(FIXTURES) as FixtureName[];

// Matches @metapages/hash-query string encoding: btoa(encodeURIComponent(v)).
const encode = (value: string): string => btoa(encodeURIComponent(value));

// The frame's module, as a frame author writes it: link frame.css the
// documented way, optionally pick a theme, render into root.
const frameJs = (fixture: FixtureName, theme?: Theme): string => `
if (!document.getElementById("framejs-css")) {
  const l = document.createElement("link");
  l.id = "framejs-css";
  l.rel = "stylesheet";
  l.href = ${JSON.stringify(FRAME_CSS_URL)};
  document.head.appendChild(l);
}
${theme ? `document.documentElement.dataset.theme = ${JSON.stringify(theme)};` : ""}
root.innerHTML = ${JSON.stringify(FIXTURES[fixture])};
`;

const hashUrl = (params: { js: string; css?: string }): string => {
  const parts = [`js=${encode(params.js)}`];
  if (params.css !== undefined) parts.push(`css=${encode(params.css)}`);
  return `/#?${parts.join("&")}`;
};

// Pages the test serves itself (via page.route) on the app's origin.
const HARNESS_IFRAME = "/__test__/frame-css/iframe-harness";
const HARNESS_INPAGE = "/__test__/frame-css/inpage-harness";

// The transient css param used on path 4: touches the page, not the ground.
const CSS_PARAM = "body { outline: 1px solid rgb(1, 2, 3); }";

let frameCssText = "";
// Whether the frame.css under test carries the `.frame` ground (the additive
// change #127 asks of frame.css). Asserted only when present, so this suite
// runs green against the stylesheet deployed today and starts enforcing the
// guarantee the moment it ships. Once it has shipped, delete this flag and
// assert unconditionally, so a later removal fails instead of switching the
// check off.
let frameCarriesGround = false;
const shortIds = new Map<FixtureName, string>();

test.beforeAll(async ({ browser, playwright }) => {
  if (FRAME_CSS_FILE) {
    frameCssText = readFileSync(FRAME_CSS_FILE, "utf8");
  } else {
    const unreachable = `could not fetch frame.css from ${FRAME_CSS_URL}. ` +
      "Set FRAME_CSS_URL to a reachable frame.css, or FRAME_CSS_FILE to a " +
      "local copy (FRAMEJS_APP_ORIGIN, e.g. from .env, also picks the origin)";
    const ctx = await playwright.request.newContext({ ignoreHTTPSErrors: true });
    try {
      const res = await ctx.get(FRAME_CSS_URL).catch((err) => {
        throw new Error(`${unreachable}: ${err}`);
      });
      expect(res.ok(), `${unreachable}: HTTP ${res.status()}`).toBeTruthy();
      frameCssText = await res.text();
    } finally {
      await ctx.dispose();
    }
  }
  // Ask the browser, not a regex: whatever the rule's spelling (grouped
  // selector, shorthand, @layer), does a `.frame` element get painted?
  const page = await browser.newPage();
  try {
    frameCarriesGround = await page.evaluate((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      document.adoptedStyleSheets = [sheet];
      const el = document.createElement("div");
      el.className = "frame";
      document.body.appendChild(el);
      const bg = getComputedStyle(el).backgroundColor;
      return bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg);
    }, frameCssText);
  } finally {
    await page.close();
  }
});

test.beforeEach(async ({ page }) => {
  if (FRAME_CSS_FILE) {
    await page.route(FRAME_CSS_URL, (route) =>
      route.fulfill({
        contentType: "text/css",
        headers: { "access-control-allow-origin": "*" },
        body: frameCssText,
      }));
  }
});

async function shortId(
  page: Page,
  fixture: FixtureName,
): Promise<string> {
  let id = shortIds.get(fixture);
  if (!id) {
    const res = await page.request.post("/api/shorten/json", {
      data: { js: frameJs(fixture) },
    });
    expect(res.ok()).toBeTruthy();
    id = ((await res.json()) as { id: string }).id;
    shortIds.set(fixture, id);
  }
  return id;
}

// --- Render paths on framejs.io (the frame owns its document) -------------

type RuntimePath = "hash" | "short" | "iframe" | "hash+css";
const RUNTIME_PATHS: RuntimePath[] = ["hash", "short", "iframe", "hash+css"];

async function openRuntime(
  page: Page,
  path: RuntimePath,
  fixture: FixtureName,
  theme?: Theme,
): Promise<Frame> {
  if (path === "short") {
    await page.goto(`/j/${await shortId(page, fixture)}`);
  } else if (path === "iframe") {
    const src = hashUrl({ js: frameJs(fixture, theme) });
    await page.route(`**${HARNESS_IFRAME}`, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><body style="margin: 0; background: #fff">
<p>Third-party page</p>
<iframe src=${JSON.stringify(src)} style="width: 800px; height: 500px; border: 0"></iframe>
</body></html>`,
      }));
    await page.goto(HARNESS_IFRAME);
  } else {
    await page.goto(
      hashUrl({
        js: frameJs(fixture, theme),
        css: path === "hash+css" ? CSS_PARAM : undefined,
      }),
    );
  }

  let frame = page.mainFrame();
  if (path === "iframe") {
    await expect.poll(() => page.frames().length).toBeGreaterThan(1);
    frame = page.frames().find((f) => f !== page.mainFrame())!;
  }
  // Rendered, and frame.css loaded (its tokens resolve on the document).
  await expect
    .poll(() =>
      frame.evaluate(() =>
        !!document.querySelector("[data-fixture]") &&
        getComputedStyle(document.documentElement)
            .getPropertyValue("--paper").trim() !== ""
      ), { timeout: 15_000 })
    .toBe(true);
  return frame;
}

for (const scheme of ["light", "dark"] as Scheme[]) {
  test.describe(`framejs.io runtime, colorScheme=${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const path of RUNTIME_PATHS) {
      // The theme label is varied on the hash path; the others are the same
      // document reached differently, so the unlabelled default covers them.
      const themes: Theme[] = path === "hash"
        ? [undefined, "light", "dark"]
        : [undefined];
      for (const theme of themes) {
        for (const fixture of FIXTURE_NAMES) {
          test(`${path} · ${fixture} · data-theme=${theme ?? "absent"}`, async ({ page }) => {
            const frame = await openRuntime(page, path, fixture, theme);
            const palette = PALETTE[theme ?? scheme];
            const s = await frame.evaluate(computedState);

            // The document is the canvas: body paints the ground, exactly as
            // before — the guard against "just move it to .frame".
            expect(s.paper).toBe(palette.paper);
            expect(s.ink).toBe(palette.ink);
            expect(s.bodyBackground).toBe(palette.paper);
            expect(s.bodyColor).toBe(palette.ink);
            if (fixture === "full-bleed") {
              // No shell to carry a ground: it still sits on body's.
              expect(s.groundUnderFixture).toBe(palette.paper);
            }
            if (fixture === "shell" && frameCarriesGround) {
              expect(s.frameBackground).toBe(palette.paper);
            }
            if (path === "hash+css") {
              expect(s.bodyOutlineColor).toBe("rgb(1, 2, 3)");
            }
            expect(s.lowContrast).toEqual([]);
          });
        }
      }
    }
  });
}

// --- Path 5: in-page, by an embedder following the EMBEDDING contract -----

// The embedder transform from the in-page contract, as an embedder
// would write it: keep everything, re-anchored to the host with @scope
// (`:root`/`html`/`body` → `:scope`), but drop the ground and the box from the
// rules that targeted `html`/`body` — `.frame` carries the ground, the page
// owns the box. Runs in the browser so it can use the CSSOM parser.
function scopeFrameCss(
  { css, host }: { css: string; host: string },
): string {
  const DROP =
    /^(background|height|min-height|max-height|width|min-width|max-width|overflow|position|inset|top|right|bottom|left)(-|$)/;
  const DOCUMENT_TYPE = /(^|[\s>+~(,])(html|body)(?=$|[\s>+~:.[#),])/g;

  const splitSelectors = (text: string): string[] => {
    const out: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (c === "," && depth === 0) {
        out.push(text.slice(start, i).trim());
        start = i + 1;
      }
    }
    out.push(text.slice(start).trim());
    return out;
  };

  const declarations = (style: CSSStyleDeclaration, canvas: boolean) => {
    const out: string[] = [];
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      if (canvas && DROP.test(prop)) continue;
      const important = style.getPropertyPriority(prop) ? " !important" : "";
      out.push(`${prop}: ${style.getPropertyValue(prop)}${important};`);
    }
    return out.join(" ");
  };

  const rewrite = (rules: CSSRuleList): { scoped: string; global: string } => {
    let scoped = "";
    let global = "";
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const doc: string[] = [];
        const rest: string[] = [];
        for (const sel of splitSelectors(rule.selectorText)) {
          DOCUMENT_TYPE.lastIndex = 0;
          if (DOCUMENT_TYPE.test(sel)) {
            DOCUMENT_TYPE.lastIndex = 0;
            doc.push(sel.replace(DOCUMENT_TYPE, "$1:scope"));
          } else {
            rest.push(sel.replaceAll(":root", ":scope"));
          }
        }
        if (doc.length) {
          const body = declarations(rule.style, true);
          if (body) scoped += `${doc.join(", ")} { ${body} }\n`;
        }
        if (rest.length) {
          scoped += `${rest.join(", ")} { ${declarations(rule.style, false)} }\n`;
        }
      } else if (rule instanceof CSSMediaRule) {
        const inner = rewrite(rule.cssRules);
        if (inner.scoped) {
          scoped += `@media ${rule.conditionText} {\n${inner.scoped}}\n`;
        }
        if (inner.global) {
          global += `@media ${rule.conditionText} {\n${inner.global}}\n`;
        }
      } else {
        // @font-face, @keyframes: document-wide by nature.
        global += `${rule.cssText}\n`;
      }
    }
    return { scoped, global };
  };

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  const { scoped, global } = rewrite(sheet.cssRules);
  return `${global}\n@scope (${host}) {\n${scoped}}\n`;
}

// The page a frame is dropped into: its own ground and text colour (matching
// the theme it labels the host with), a sizing class on the host, and ordinary
// content around it.
const PAGE = {
  light: { background: "rgb(255, 255, 255)", color: "rgb(34, 34, 34)" },
  dark: { background: "rgb(11, 11, 11)", color: "rgb(221, 221, 221)" },
} as const;
const HOST_HEIGHT = "240px";

async function openInPage(
  page: Page,
  fixture: FixtureName,
  theme: Theme,
): Promise<void> {
  const look = PAGE[theme ?? "light"];
  await page.route(`**${HARNESS_INPAGE}`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><style>
body { margin: 0; background: ${look.background}; color: ${look.color}; font-family: serif; }
.post-frame { height: ${HOST_HEIGHT}; }
</style></head><body>
<article>
  <p class="page-text">Ordinary page content before the frame.</p>
  <div id="host" class="post-frame"${theme ? ` data-theme="${theme}"` : ""}></div>
  <p class="page-text">Ordinary page content after the frame.</p>
</article>
</body></html>`,
    }));
  await page.goto(HARNESS_INPAGE);

  const scoped = await page.evaluate(scopeFrameCss, {
    css: frameCssText,
    host: "#host",
  });
  await page.evaluate(
    ({ scoped, markup }) => {
      const style = document.createElement("style");
      style.id = "framejs-css-scoped";
      style.textContent = scoped;
      document.head.appendChild(style);
      document.getElementById("host")!.innerHTML = markup;
    },
    { scoped, markup: FIXTURES[fixture] },
  );
}

for (const scheme of ["light", "dark"] as Scheme[]) {
  test.describe(`in-page embed, colorScheme=${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const theme of ["light", "dark"] as Scheme[]) {
      for (const fixture of FIXTURE_NAMES) {
        test(`in-page · ${fixture} · data-theme=${theme}`, async ({ page }) => {
          await openInPage(page, fixture, theme);
          const palette = PALETTE[theme];
          const look = PAGE[theme];
          const s = await page.evaluate(computedState, "#host");

          // The host follows the page's label, never the viewer's OS.
          expect(s.paper).toBe(palette.paper);
          expect(s.ink).toBe(palette.ink);
          // The page owns the box and the ground…
          expect(s.hostHeight).toBe(HOST_HEIGHT);
          expect(s.hostBackground).toBe(TRANSPARENT);
          // …and frame.css does not leak onto the page around the host.
          expect(s.bodyBackground).toBe(look.background);
          expect(s.pageTextColor).toBe(look.color);
          if (fixture === "full-bleed") {
            // Nothing carries a ground: it sits on the page's.
            expect(s.groundUnderFixture).toBe(look.background);
          }
          if (fixture === "shell" && frameCarriesGround) {
            // .frame carries its own ground once html/body are dropped.
            expect(s.frameBackground).toBe(palette.paper);
          }
          expect(s.lowContrast).toEqual([]);
        });
      }
    }

    test("in-page · unlabelled host follows the viewer's OS (why data-theme is required)", async ({ page }) => {
      await openInPage(page, "bare", undefined);
      const s = await page.evaluate(computedState, "#host");
      // `:root:not([data-theme="light"])`, re-anchored, matches a host with no
      // data-theme at all — so the frame follows the OS while the page
      // follows its author. EMBEDDING tells embedders to label the host.
      expect(s.ink).toBe(PALETTE[scheme].ink);
      expect(s.hostHeight).toBe(HOST_HEIGHT);
    });
  });
}

// --- Computed-state probe (runs in the page) -------------------------------

// Everything the assertions read, in one evaluate. `hostSelector` is the
// element frame.css is anchored to: the host div in-page, else <html>.
function computedState(hostSelector?: string) {
  const host = hostSelector
    ? document.querySelector(hostSelector) as HTMLElement
    : document.documentElement;
  const hostStyle = getComputedStyle(host);
  const bodyStyle = getComputedStyle(document.body);
  const scope = hostSelector ? host : document.getElementById("root")!;
  const fixture = scope.querySelector("[data-fixture]") as HTMLElement;
  const frameEl = scope.querySelector(".frame");

  // Resolve a custom property to a computed colour.
  const resolve = (name: string): string => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    host.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  };

  const isPainted = (c: string) =>
    c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c);
  const groundOf = (el: Element | null): string => {
    for (let n = el; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (isPainted(bg)) return bg;
    }
    return "none";
  };

  // Contrast guard: every visible text node against its nearest painted
  // ancestor. Catches the whole near-white-on-white family, not one instance.
  const channels = (c: string) =>
    (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const luminance = (c: string) => {
    const [r, g, b] = channels(c).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const lowContrast: string[] = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent?.trim() || !el || !el.getClientRects().length) continue;
    const color = getComputedStyle(el).color;
    const ground = groundOf(el);
    if (ground === "none") {
      // Nothing paints behind it: the ground this suite exists to guard is gone.
      lowContrast.push(`"${n.textContent.trim()}": ${color} on no painted ground`);
      continue;
    }
    const ratio = contrast(color, ground);
    if (ratio < 3) {
      lowContrast.push(
        `"${n.textContent.trim()}": ${color} on ${ground} (${ratio.toFixed(2)})`,
      );
    }
  }

  return {
    paper: resolve("--paper"),
    ink: resolve("--ink"),
    hostHeight: hostStyle.height,
    hostBackground: hostStyle.backgroundColor,
    bodyBackground: bodyStyle.backgroundColor,
    bodyColor: bodyStyle.color,
    bodyOutlineColor: bodyStyle.outlineColor,
    pageTextColor: document.querySelector(".page-text")
      ? getComputedStyle(document.querySelector(".page-text")!).color
      : null,
    frameBackground: frameEl ? getComputedStyle(frameEl).backgroundColor : null,
    groundUnderFixture: groundOf(fixture),
    lowContrast,
  };
}
