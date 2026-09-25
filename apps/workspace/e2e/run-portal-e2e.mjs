import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPortalE2eEnvironment } from "./support/portal-e2e-database-guard.mjs";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const rootDirectory = path.resolve(appDirectory, "../..");

const { development, databaseUrl, publishableKey, secretKey } =
  loadPortalE2eEnvironment(appDirectory);

const environment = {
  ...process.env,
  ...development,
  DATABASE_URL: databaseUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
  CLERK_SECRET_KEY: secretKey,
  CLERK_PUBLISHABLE_KEY: publishableKey,
};

function run(args) {
  return new Promise((resolve, reject) => {
    const corepackScript = path.join(
      path.dirname(process.execPath),
      "node_modules",
      "corepack",
      "dist",
      "corepack.js",
    );
    const executable =
      process.platform === "win32" ? process.execPath : "corepack";
    const commandArgs =
      process.platform === "win32"
        ? [corepackScript, "pnpm", ...args]
        : ["pnpm", ...args];
    const child = spawn(executable, commandArgs, {
      cwd: rootDirectory,
      env: environment,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Command failed: ${args.join(" ")}`)),
    );
  });
}

await run(["--filter", "@invessiv/db", "db:migrate:dev"]);
await run(["--filter", "@invessiv/workspace", "build"]);
await run([
  "--filter",
  "@invessiv/workspace",
  "exec",
  "playwright",
  "test",
  "--config",
  "playwright.portal.config.ts",
]);
