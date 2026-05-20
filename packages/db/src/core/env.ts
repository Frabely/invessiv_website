import path from "node:path";
import fs from "node:fs";
import { config as loadDotenv } from "dotenv";

let envLoaded = false;

export function loadLocalEnvFiles() {
  if (envLoaded) {
    return;
  }

  const cwd = findWorkspaceRoot(process.cwd());
  const envFiles = [
    ".env.local",
    ".env.development.local",
    ".env.preview.local",
    ".env.production.local",
  ];

  for (const envFile of envFiles) {
    loadDotenv({
      quiet: true,
      override: false,
      path: path.join(cwd, envFile),
    });
  }

  envLoaded = true;
}

export function findWorkspaceRoot(startDirectory: string) {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    if (fs.existsSync(path.join(currentDirectory, "pnpm-workspace.yaml"))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return path.resolve(startDirectory);
    }

    currentDirectory = parentDirectory;
  }
}

export function getDatabaseUrl() {
  if (!process.env.VITEST) {
    loadLocalEnvFiles();
  }

  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.INVESSIV_DATABASE_DATABASE_URL?.trim() ||
    process.env.INVESSIV_DATABASE_POSTGRES_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null
  );
}
