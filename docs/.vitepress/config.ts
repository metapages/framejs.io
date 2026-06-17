import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "framejs.io",
    description: "Run and edit JavaScript in the browser, embedded in the URL",
    base: "/docs/",
    // Generate links without the .html suffix (e.g. /docs/intro instead of
    // /docs/intro.html). Requires the server to serve `foo.html` when `/foo`
    // is requested — see the /docs/* serveStatic rewrite in worker/server.ts.
    cleanUrls: true,

    ignoreDeadLinks: [/^http:\/\/localhost/],

    themeConfig: {
      nav: [
        { text: "Docs", link: "/intro" },
        { text: "Examples", link: "/examples/" },
        { text: "Integrations", link: "/integrations/jupyter" },
        { text: "Development", link: "/development/local-setup" },
        { text: "Create", link: "https://framejs.io" },
      ],

      sidebar: [
        { text: "Intro", link: "/intro" },
        {
          text: "Guide",
          items: [
            { text: "Quickstart", link: "/guide/quickstart" },
            { text: "Overview", link: "/guide/overview" },
            { text: "JavaScript API", link: "/guide/javascript-api" },
            { text: "URL State", link: "/guide/url-state" },
            { text: "Short URLs", link: "/guide/short-urls" },
            { text: "Embedding", link: "/guide/embedding" },
            { text: "Rendering in a Website", link: "/guide/rendering" },
          ],
        },
        {
          text: "AI",
          items: [
            { text: "Setup", link: "/ai/setup" },
            {
              text: "Agent Skill (SKILL.md)",
              link: "https://framejs.io/skill/framejs/SKILL.md",
            },
            {
              text: "command-js.md",
              link: "https://framejs.io/command-js.md",
            },
            {
              text: "llms-prompt.md",
              link: "https://framejs.io/llms-prompt.md",
            },
          ],
        },
        {
          text: "Examples",
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
          ],
        },
        {
          text: "Development",
          items: [
            { text: "Local Setup", link: "/development/local-setup" },
            { text: "Architecture", link: "/development/architecture" },
            { text: "Editor", link: "/development/editor" },
            { text: "Worker", link: "/development/worker" },
            { text: "Deployment", link: "/development/deployment" },
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
