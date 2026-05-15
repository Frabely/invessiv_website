import path from "node:path";
import { config as loadDotenv } from "dotenv";

let envLoaded = false;

export function loadLocalEnvFiles() {
  if (envLoaded) {
    return;
  }

  const cwd = process.cwd();
  const envFiles = [".env.local", ".env.development.local"];

  for (const envFile of envFiles) {
    loadDotenv({
      quiet: true,
      override: false,
      path: path.join(cwd, envFile),
    });
  }

  envLoaded = true;
}
