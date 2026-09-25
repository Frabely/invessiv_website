import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const rootDirectory = path.resolve(appDirectory, "../..");

function readEnv(file) {
  return existsSync(file) ? parse(readFileSync(file, "utf8")) : {};
}

const rootDevelopment = readEnv(
  path.join(rootDirectory, ".env.development.local"),
);
const appDevelopment = readEnv(
  path.join(appDirectory, ".env.development.local"),
);
const development = { ...rootDevelopment, ...appDevelopment };
const production = readEnv(path.join(rootDirectory, ".env.production.local"));
const preview = readEnv(path.join(rootDirectory, ".env.preview.local"));

if (
  !development.DATABASE_URL ||
  development.DATABASE_URL === production.DATABASE_URL ||
  development.DATABASE_URL === preview.DATABASE_URL ||
  !development.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") ||
  !development.CLERK_SECRET_KEY?.startsWith("sk_test_")
) {
  throw new Error(
    "Portal E2E requires distinct development DB and Clerk development credentials.",
  );
}

const environment = {
  ...process.env,
  ...development,
  CLERK_PUBLISHABLE_KEY: development.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
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
