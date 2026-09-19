import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

// ---------------------------------------------------------------------------
// Two origins, one docs site.
//
// These docs are served from BOTH https://framejs.io/docs (the runtime) and
// https://framejs.app/docs (the account app), each with its own copy of the
// build. A reader who lands on one should never be bounced to the other just by
// clicking a link, so every build is parameterised by the origin it will be
// served from and every in-docs link is kept relative.
//
//   FRAMEJS_DOCS_ORIGIN  the origin this build will be served from.
//                        Default https://framejs.io (`just docs/build`).
//                        framejs.app passes https://framejs.app — see
//                        framejs.app's frontend/worker/justfile `build-docs`.
//   FRAMEJS_DOCS_OUT     where to write the build. Default .vitepress/dist.
//                        framejs.app points this straight at its static/docs.
//
// Links to the framejs.io RUNTIME (/j/…, /#?js=…, /api/…, /skill/…, /llms-*)
// stay absolute in both builds on purpose: those are the runtime, which only
// framejs.io serves. Only the docs themselves are mirrored.
// ---------------------------------------------------------------------------
const SITE_ORIGIN = process.env.FRAMEJS_DOCS_ORIGIN ?? "https://framejs.io";
const BRAND = new URL(SITE_ORIGIN).host; // "framejs.io" | "framejs.app"
const TAGLINE = "share interactive visualizations in a URL";

// The canonical copy is the one on framejs.app: two public copies of the same
// pages is duplicate content, so both builds point search engines at that one.
const CANONICAL_ORIGIN = "https://framejs.app";
const APP_ORIGIN = "https://framejs.app";
const isAppOrigin = SITE_ORIGIN === APP_ORIGIN;

// An absolute link to EITHER copy of these docs. Rewritten to a site-relative
// path so the reader stays on the origin they are already on. The path is made
// relative to the site `base` (/docs/) because VitePress's own link plugin
// prepends `base` to every leading-slash href (see linkPlugin in
// vitepress/dist/node) — a `/docs/...` href here would resolve to /docs/docs/....
const DOCS_URL_RE = /^https?:\/\/framejs\.(?:io|app)\/docs(?=$|[/?#])/;

// Standalone reveal.js decks live in public/presentations/<deck>/index.html.
// In production the worker's serveStatic resolves a directory request to its
// index.html, but the VitePress *dev* server (used by `just dev`) does not —
// it falls through to the SPA shell (blank <title>, no deck) for a bare
// directory URL. This dev-only middleware rewrites
//   /docs/presentations/<deck>  and  /docs/presentations/<deck>/
// to the deck's index.html so the clean URL renders in dev too, matching prod.
const servePresentationIndex = {
  name: "serve-presentation-index",
  configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
    server.middlewares.use(
      (req: { url?: string }, _res: unknown, next: () => void) => {
        if (req.url) {
          const m = req.url.match(
            /^(\/docs\/presentations\/[^/?#]+)\/?(\?[^#]*)?$/,
          );
          if (m) req.url = `${m[1]}/index.html${m[2] ?? ""}`;
        }
        next();
      },
    );
  },
};

export default withMermaid(
  defineConfig({
    title: `${BRAND} — ${TAGLINE}`,
    description:
      "Create and share interactive JavaScript visualizations, charts, dashboards, and apps in the browser. The code lives in the URL — no server, build, or account. Generate it with AI or write it by hand.",
    base: "/docs/",
    // Generate links without the .html suffix (e.g. /docs/guide/intro instead of
    // /docs/guide/intro.html). Requires the server to serve `foo.html` when `/foo`
    // is requested — see the /docs/* serveStatic rewrite in worker/server.ts.
    cleanUrls: true,

    ignoreDeadLinks: [/^http:\/\/localhost/],

    // framejs.app builds its own copy straight into its static dir.
    outDir: process.env.FRAMEJS_DOCS_OUT || undefined,

    // Both copies name the framejs.app one as canonical, so the duplicate does
    // not split search ranking between the two origins.
    transformHead({ pageData }) {
      const path = pageData.relativePath
        .replace(/(^|\/)index\.md$/, "$1")
        .replace(/\.md$/, "");
      return [[
        "link",
        { rel: "canonical", href: `${CANONICAL_ORIGIN}/docs/${path}` },
      ]];
    },

    markdown: {
      // Keep the reader on the origin they arrived at. A link written as
      // https://framejs.io/docs/... (or .app) points at the OTHER copy of these
      // same pages; rewrite it to a site-relative path, which VitePress then
      // resolves against `base` and routes client-side like any internal link.
      //
      // This wraps VitePress's own link_open rule (registered by linkPlugin
      // before `config` runs), so by the time that rule sees the href it is
      // already internal — no target="_blank", no external-link icon.
      config(md) {
        const renderLink = md.renderer.rules.link_open!;
        md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
          const href = tokens[idx].attrGet("href");
          if (href && DOCS_URL_RE.test(href)) {
            tokens[idx].attrSet("href", href.replace(DOCS_URL_RE, "") || "/");
          }
          return renderLink(tokens, idx, options, env, self);
        };
      },
    },

    vite: {
      plugins: [servePresentationIndex],
    },

    // Developer docs (docs/development/**) are intentionally NOT published to the
    // public docs site — they live in the repo for GitHub navigation only.
    // See docs/development/README.md.
    // `public/**` holds standalone assets (slide decks, JupyterLite) that are
    // copied verbatim; their .md files are reveal.js sources, not VitePress
    // pages, and fail to compile as Vue SFCs if not excluded.
    srcExclude: ["development/**", "public/**"],

    themeConfig: {
      // The navbar base title is just the brand. The full tagline is appended
      // via CSS (::after in blueprint.css) only when there is no sidebar — on
      // doc pages the sidebar shrinks the navbar and the tagline would overlap
      // the search box. `title` above still carries the full text for <title>.
      siteTitle: BRAND,

      nav: [
        { text: "AI", link: "/integrations/claude-mcp" },
        { text: "Docs", link: "/quickstart" },
        // { text: "Examples", link: "/examples/" },
        // { text: "Integrations", link: "/integrations/jupyter" },
        { text: "Blog", link: "/blog/about" },
        // The account app. When THIS build is the copy framejs.app serves that
        // is the same origin, so keep it in the current tab instead of letting
        // VitePress treat it as an external site.
        {
          text: "Create",
          link: APP_ORIGIN,
          ...(isAppOrigin ? { target: "_self" as const } : {}),
        },
      ],

      sidebar: [
        { text: "Quickstart", link: "/quickstart" },

        // The two AI on-ramps, at the top of the sidebar rather than buried in
        // the collapsed Integrations group — they are how most people start.
        {
          text: "Use with AI",
          items: [
            {
              text: "MCP: Claude Connector",
              link: "/integrations/claude-mcp",
            },
            { text: "Console: agent skill", link: "/guide/ai" },
          ],
        },

        {
          text: "Guide",
          items: [
            { text: "Intro", link: "/guide/intro" },
            { text: "Overview", link: "/guide/overview" },
            { text: "Embedding", link: "/guide/embedding" },
            { text: "Rendering in a Website", link: "/guide/rendering" },
            { text: "URL State", link: "/guide/url-state" },
            { text: "Short URLs", link: "/guide/short-urls" },
            { text: "JavaScript API", link: "/guide/javascript-api" },
            { text: "Persistence & Retention", link: "/guide/persistence" },
            { text: "Local File I/O", link: "/guide/local-file-io" },
          ],
        },
        {
          text: "Examples",
          collapsed: true,
          items: [
            { text: "Gallery", link: "/examples/" },
            { text: "Multi Demo", link: "/examples/multi-demo" },
            { text: "Interactive 3D Globe", link: "/examples/globe" },
            { text: "Data Dashboard", link: "/examples/data-dashboard" },
            { text: "Plot Data", link: "/examples/plot-data" },
            {
              text: "Scientific Visualization",
              link: "/examples/scientific-visualization",
            },
            { text: "Cytoscape", link: "/examples/cytoscape" },
            { text: "NGLViewer", link: "/examples/nglviewer" },
          ],
        },
        {
          text: "Integrations",
          collapsed: true,
          items: [
            { text: "Claude Connector (MCP)", link: "/integrations/claude-mcp" },
            { text: "Jupyter", link: "/integrations/jupyter" },
            { text: "JupyterLite (Live)", link: "/integrations/jupyterlite" },
            { text: "marimo", link: "/integrations/marimo" },
          ],
        },
        {
          text: "Blog",
          collapsed: true,
          items: [
            { text: "About", link: "/blog/about" },
            {
              text: "What problems is this solving",
              link: "/blog/why",
            },
            {
              text: "Open Infrastructure & FAIR",
              link: "/blog/open-infrastructure",
            },
          ],
        },
        {
          text: "Talks & Slides",
          collapsed: true,
          items: [
            { text: "All talks", link: "/talks" },
            {
              text: "OMSF Office Hours 2026 (overview)",
              // Static reveal.js deck in public/presentations. Path is relative
              // to the site `base` (/docs/) — VitePress prepends it — so do NOT
              // include /docs here or it resolves to /docs/docs/.
              link: "/presentations/2026-07-omsf-office-hours/",
              target: "_blank",
            },
          ],
        },
      ],

      search: {
        provider: "local",
      },

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/metapages/framejs.io",
        },
      ],
    },
  }),
);
