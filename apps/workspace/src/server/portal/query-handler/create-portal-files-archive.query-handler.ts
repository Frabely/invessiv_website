import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";

/** The whole archive fails when any id is not visible to the reader — nothing partial leaks. */
export async function createPortalFilesArchive(
  reader: PortalReader,
  fileIds: readonly string[],
) {
  const invalid = fileArchiveService.checkSelection(reader.customerId, fileIds);
  if (invalid) return { ok: false, code: invalid } as const;
  const rows = await getDrizzleDatabaseClient()
    .select(fileArchiveService.columns)
    .from(files)
    .where(
      and(
        eq(files.customer_id, reader.customerId),
        inArray(files.id, [...fileIds]),
        portalFileService.visibleCondition(reader),
      ),
    );
  return fileArchiveService.plan(fileIds, rows);
}
