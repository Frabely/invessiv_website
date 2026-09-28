import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import {
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
} from "@/common/constants/crm/files/file-archive-limits";
import { canOn } from "@/common/patterns/auth/can-on";
import { fileAccessService } from "../services/files/file-access-service";
import { fileSchemas } from "../services/files/file-schemas";

export async function createFilesArchive(
  customerId: string,
  fileIds: readonly string[],
  actor: WorkspaceActor,
) {
  if (
    !fileSchemas.id.safeParse(customerId).success ||
    fileIds.length < 1 ||
    new Set(fileIds).size !== fileIds.length ||
    !fileIds.every((id) => fileSchemas.id.safeParse(id).success)
  )
    return { ok: false, code: E.Validation } as const;
  if (fileIds.length > MAX_ARCHIVE_FILES)
    return { ok: false, code: E.ArchiveLimit } as const;

  const rows = await getDrizzleDatabaseClient()
    .select({
      id: files.id,
      projectId: files.project_id,
      source: files.source,
      assetKind: files.asset_kind,
      displayName: files.display_name,
      storageKey: files.storage_key,
      sizeBytes: files.size_bytes,
      url: files.url,
    })
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
    rows.length !== fileIds.length ||
    rows.some(
      (row) =>
        !canOn(actor, Permission.FilesRead, {
          customerId,
          projectId: row.projectId ?? undefined,
        }),
    )
  )
    return { ok: false, code: E.NotFound } as const;

  let totalBytes = 0;
  for (const row of rows) {
    if (row.assetKind === AssetKind.Video)
      return { ok: false, code: E.ArchiveVideo } as const;
    if (row.storageKey) {
      if (!row.sizeBytes || row.sizeBytes <= 0)
        return { ok: false, code: E.Validation } as const;
      totalBytes += row.sizeBytes;
    } else if (!row.url) {
      return { ok: false, code: E.Validation } as const;
    }
  }
  if (totalBytes > MAX_ARCHIVE_BYTES)
    return { ok: false, code: E.ArchiveLimit } as const;

  const byId = new Map(rows.map((row) => [row.id, row]));
  return { ok: true, rows: fileIds.map((id) => byId.get(id)!) } as const;
}
