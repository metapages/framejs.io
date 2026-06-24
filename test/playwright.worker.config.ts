import { defineConfig, devices } from "@playwright/test";

// E2E config for the Deno Fresh worker (frontend/worker), which serves over
// HTTPS with a per-machine mkcert cert at https://localhost:5173. Kept separate
// from the inherited playwright.config.ts (that one targets a sibling app).
//
// Prerequisite: the nhost api stack must be up (`just api/dev`) — the browser
// talks to local.auth/local.graphql.local.nhost.run directly.
const BASE_URL = process.env.WORKER_BASE_URL ?? "https://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.e2e.spec.ts",
  // Auth/CRUD share one user across a serial flow, so don't parallelise.
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Reuse a dev server if one is already running, otherwise start one.
  webServer: {
    command: "deno task dev",
    cwd: "../frontend/worker",
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
