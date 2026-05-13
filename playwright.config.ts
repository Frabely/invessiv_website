import { config as loadDotenv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadDotenv({ path: ".env.local", override: false, quiet: true });
loadDotenv({ path: ".env.development.local", override: false, quiet: true });
loadDotenv({ path: ".env.production.local", override: false, quiet: true });

const PORT = 4173;
const localBaseUrl = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? localBaseUrl,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --hostname localhost --port ${PORT}`,
        env: {
          ...process.env,
          CONTACT_MAIL_PROVIDER:
            process.env.PLAYWRIGHT_CONTACT_MAIL_PROVIDER ?? "noop",
          VERCEL_ENV: process.env.VERCEL_ENV ?? "development",
          VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV ?? "development",
        },
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
