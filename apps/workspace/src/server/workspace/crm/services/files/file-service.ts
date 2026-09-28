import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { storageService } from "@/server/shared/files/storage-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { fileSchemas } from "./file-schemas";
import { fileAccessService } from "./file-access-service";
import { fileMappingService } from "./file-mapping-service";

async function findReadable(id: string, actor: WorkspaceActor) {
  if (!fileSchemas.id.safeParse(id).success) return null;
  const [row] = await getDrizzleDatabaseClient()
    .select()
    .from(files)
    .where(
      and(
        eq(files.id, id),
        eq(files.status, FileStatus.Ready),
        eq(files.source, FileSource.Upload),
        isNull(files.orphaned_at),
        fileAccessService.condition(actor, Permission.FilesRead),
      ),
    )
    .limit(1);
  return row ?? null;
}

function conflict(row: typeof files.$inferSelect): FileResult<never> {
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: row.version,
      current: fileMappingService.toDto(row),
    },
  };
}

/** Called only while holding the file row lock. Retain the key when storage is unavailable. */
async function remove(
  tx: ContactDatabaseTransaction,
  row: typeof files.$inferSelect,
): Promise<boolean> {
  if (row.storage_key) {
    try {
      await storageService.getAdapter().delete(row.storage_key);
    } catch {
      const marked = await updateVersioned({
        tx,
        table: files,
        id: row.id,
        expectedVersion: row.version,
        patch: { orphaned_at: new Date() },
        toDto: fileMappingService.toDto,
      });
      if (!marked.ok) throw new Error("Locked file disappeared during cleanup");
      console.error("[workspace-files] storage cleanup deferred", {
        code: FileApiErrorCode.StorageUnavailable,
      });
      return false;
    }
  }
  await tx.delete(files).where(eq(files.id, row.id));
  return true;
}

export const fileService = { findReadable, conflict, remove };
