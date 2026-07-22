import { defineConfig, devices } from "@playwright/test";

const DEFAULT_APP_FQDN = "framejs-io.localhost";
const APP_FQDN = process.env.APP_FQDN ?? DEFAULT_APP_FQDN;
const APP_PORT = process.env.APP_PORT ?? "4430";

// The default host is *.localhost, which the browser puts in the local address
// space — so the page origin is itself "local". Overriding it (see APP_FQDN in
// .env) is how the localhost-input tests get checked against a non-localhost
// origin, and it's worth saying out loud that the run isn't the default one.
if (APP_FQDN !== DEFAULT_APP_FQDN) {
  console.log(
    `⚠️  APP_FQDN override: tests run against https://${APP_FQDN}:${APP_PORT} ` +
      `(default: ${DEFAULT_APP_FQDN}). The dev stack must be up on that host.`,
  );
}

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
