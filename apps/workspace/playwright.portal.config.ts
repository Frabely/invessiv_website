import { defineConfig, devices } from "@playwright/test";
import { loadPortalE2eEnvironment } from "./e2e/support/portal-e2e-database-guard.mjs";

const { development, databaseUrl, publishableKey, secretKey } =
  loadPortalE2eEnvironment(__dirname);
Object.assign(process.env, development, {
  DATABASE_URL: databaseUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
  CLERK_SECRET_KEY: secretKey,
});
process.env.CLERK_PUBLISHABLE_KEY = publishableKey;

const baseURL = "http://localhost:4174";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  timeout: 90_000,
  reporter: "list",
  use: { baseURL, screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: {
    command: "corepack pnpm exec next start --hostname localhost --port 4174",
    port: 4174,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
      CLERK_SECRET_KEY: secretKey,
    },
  },
  projects: [
    { name: "portal-setup", testMatch: /portal\.setup\.ts/ },
    {
      name: "portal-chromium",
      testMatch: /portal-(access|dashboard)\.e2e\.ts/,
      dependencies: ["portal-setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
