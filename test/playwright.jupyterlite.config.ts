import { defineConfig, devices } from "@playwright/test";

// The JupyterLite demo embedded in the docs (/docs/jupyterlite/), tested as the
// built static site — no dev stack. Build it first: `just examples/jupyterlite/build`
// (`just examples/test-jupyterlite` does both).
//
// Kept apart from playwright.config.ts on purpose: that suite needs the docker
// dev stack, this one needs only the built bundle plus the network (Pyodide,
// PyPI and the production framejs.app/framejs.io the demo's widgets load).
const PORT = Number(process.env.JUPYTERLITE_PORT ?? 8734);

export default defineConfig({
  testDir: "./jupyterlite",
  testMatch: "**/*.spec.ts",
  // Pyodide boots, then micropip installs from PyPI: minutes on a cold cache.
  timeout: 240_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command:
      `python3 -m http.server ${PORT} --directory ../examples/jupyterlite/_output`,
    url: `http://localhost:${PORT}/notebooks/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
