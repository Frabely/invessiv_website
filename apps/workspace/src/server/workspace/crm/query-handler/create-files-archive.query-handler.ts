import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";
import { fileAccessService } from "../services/files/file-access-service";

export async function createFilesArchive(
  customerId: string,
  fileIds: readonly string[],
  actor: WorkspaceActor,
) {
  const invalid = fileArchiveService.checkSelection(customerId, fileIds);
  if (invalid) return { ok: false, code: invalid } as const;

  const rows = await getDrizzleDatabaseClient()
    .select({ ...fileArchiveService.columns, projectId: files.project_id })
    .from(files)
    .where(
      and(
        eq(files.customer_id, customerId),
        inArray(files.id, fileIds),
        eq(files.status, FileStatus.Ready),
        isNull(files.orphaned_at),
        fileAccessService.condition(actor, Permission.FilesRead),
      ),
    );

  if (
    rows.some(
      (row) =>
        !canOn(actor, Permission.FilesRead, {
          customerId,
          projectId: row.projectId ?? undefined,
        }),
    )
  )
    return { ok: false, code: E.NotFound } as const;
  return fileArchiveService.plan(fileIds, rows);
}
