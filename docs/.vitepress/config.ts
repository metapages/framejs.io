import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

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
    title: "framejs.io — share interactive visualizations in a URL",
    description:
      "Create and share interactive JavaScript visualizations, charts, dashboards, and apps in the browser. The code lives in the URL — no server, build, or account. Generate it with AI or write it by hand.",
    base: "/docs/",
    // Generate links without the .html suffix (e.g. /docs/guide/intro instead of
    // /docs/guide/intro.html). Requires the server to serve `foo.html` when `/foo`
    // is requested — see the /docs/* serveStatic rewrite in worker/server.ts.
    cleanUrls: true,

    ignoreDeadLinks: [/^http:\/\/localhost/],

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
      siteTitle: "framejs.io",

      nav: [
        { text: "Docs", link: "/quickstart" },
        { text: "Examples", link: "/examples/" },
        { text: "Integrations", link: "/integrations/jupyter" },
        { text: "Talks", link: "/talks" },
        { text: "Create", link: "https://framejs.io" },
      ],

      sidebar: [
        { text: "Quickstart", link: "/quickstart" },

        {
          text: "Guide",
          items: [
            { text: "Intro", link: "/guide/intro" },
            { text: "AI Integration", link: "/guide/ai" },
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
          text: "AI",
          items: [{ text: "Setup", link: "/guide/ai" }],
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
            { text: "Jupyter", link: "/integrations/jupyter" },
            { text: "JupyterLite (Live)", link: "/integrations/jupyterlite" },
            { text: "marimo", link: "/integrations/marimo" },
          ],
        },
        {
          text: "Story",
          items: [
            { text: "About", link: "/story/about" },
            {
              text: "What problems is this solving",
              link: "/story/why",
            },
            {
              text: "Open Infrastructure & FAIR",
              link: "/story/open-infrastructure",
            },
          ],
        },
        {
          text: "Talks & Slides",
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
