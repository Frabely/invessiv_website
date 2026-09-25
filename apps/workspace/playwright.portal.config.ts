import { config as loadDotenv, parse } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

loadDotenv({
  path: "../../.env.development.local",
  override: true,
  quiet: true,
});
loadDotenv({ path: ".env.development.local", override: true, quiet: true });

const databaseUrl = process.env.DATABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;
const rootDirectory = path.resolve(process.cwd(), "../..");
const otherDatabaseUrl = (name: string) => {
  const file = path.join(rootDirectory, `.env.${name}.local`);
  return existsSync(file)
    ? parse(readFileSync(file, "utf8")).DATABASE_URL
    : undefined;
};
if (
  !databaseUrl ||
  databaseUrl === otherDatabaseUrl("preview") ||
  databaseUrl === otherDatabaseUrl("production") ||
  !publishableKey?.startsWith("pk_test_") ||
  !secretKey?.startsWith("sk_test_")
) {
  throw new Error(
    "Portal E2E requires the development database and Clerk development keys.",
  );
}
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
      testMatch: /portal-access\.e2e\.ts/,
      dependencies: ["portal-setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
