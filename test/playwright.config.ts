import { defineConfig, devices } from "@playwright/test";

const APP_FQDN = process.env.APP_FQDN ?? "framejs-io.localhost";
const APP_PORT = process.env.APP_PORT ?? "4430";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: `https://${APP_FQDN}:${APP_PORT}`,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
