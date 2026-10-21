/**
 * Creates the missing previews of ready image uploads, 20 files per batch, through the same
 * service as the upload path. Idempotent: a file with a preview is never selected again, and a
 * rerun after an abort continues with what is still missing.
 *
 * Usage: pnpm --filter @invessiv/workspace files:backfill-thumbnails <development|preview|production>
 * Needs the database URL of the target and the storage variables (STORAGE_PROVIDER, Blob token).
 * The output is counts only; failures are logged with file id and code, never with a file name.
 */
import { parseDatabaseTarget } from "@invessiv/db/core/database-target";
import { fileThumbnailService } from "@/server/shared/files/file-thumbnail-service";
import { configureThumbnailBackfillEnvironment } from "./configure-thumbnail-backfill-environment";

const BATCH_SIZE = 20;

async function main() {
  const target = parseDatabaseTarget(process.argv);
  if (!target)
    throw new Error(
      "Missing database target. Use one of: development, preview, production.",
    );
  configureThumbnailBackfillEnvironment(target);
  if (process.argv.includes("--check")) {
    console.log(
      `Backfill configuration validated for ${target}; no database or storage access performed.`,
    );
    return;
  }

  console.log(`Backfilling file thumbnails on ${target} …`);
  const counts = await fileThumbnailService.backfillMissing(BATCH_SIZE);
  console.log(`Created: ${counts.created}`);
  console.log(`Skipped: ${counts.skipped}`);
  console.log(`Failed: ${counts.failed}`);
  if (counts.failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Backfill failed.");
  process.exitCode = 1;
});
