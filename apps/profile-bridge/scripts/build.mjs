import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await build({
  entryPoints: {
    "service-worker": path.join(root, "src/background/service-worker.ts"),
  },
  outdir: outDir,
  bundle: true,
  format: "esm",
  target: "chrome120",
  platform: "browser",
  logLevel: "info",
});

await copyFile(
  path.join(root, "manifest.json"),
  path.join(outDir, "manifest.json"),
);

console.log(`Extension built to ${outDir}`);
