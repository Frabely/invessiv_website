import path from "node:path";
import { config as loadDotenv } from "dotenv";

let envLoaded = false;

export function loadLocalEnvFiles() {
  if (envLoaded) {
    return;
  }

  const cwd = process.cwd();
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development.local",
  ];

  for (const envFile of envFiles) {
    loadDotenv({
      override: false,
      path: path.join(cwd, envFile),
    });
  }

  envLoaded = true;
}
