import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "framejs.io",
    description: "Run and edit JavaScript in the browser, embedded in the URL",
    base: "/docs/",
    // Generate links without the .html suffix (e.g. /docs/guide/intro instead of
    // /docs/guide/intro.html). Requires the server to serve `foo.html` when `/foo`
    // is requested — see the /docs/* serveStatic rewrite in worker/server.ts.
    cleanUrls: true,

    ignoreDeadLinks: [/^http:\/\/localhost/],

    // Developer docs (docs/development/**) are intentionally NOT published to the
    // public docs site — they live in the repo for GitHub navigation only.
    // See docs/development/README.md.
    srcExclude: ["development/**"],

    themeConfig: {
      nav: [
        { text: "Docs", link: "/quickstart" },
        { text: "Examples", link: "/examples/" },
        { text: "Integrations", link: "/integrations/jupyter" },
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
            { text: "JavaScript API", link: "/guide/javascript-api" },
            { text: "URL State", link: "/guide/url-state" },
            { text: "Short URLs", link: "/guide/short-urls" },
            { text: "Local File I/O", link: "/guide/local-file-io" },
            { text: "Persistence & Retention", link: "/guide/persistence" },
            { text: "Embedding", link: "/guide/embedding" },
            { text: "Rendering in a Website", link: "/guide/rendering" },
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
