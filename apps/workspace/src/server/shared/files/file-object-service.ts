import "server-only";
import type { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { eq } from "drizzle-orm";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import {
  DOWNLOAD_URL_TTL_MS,
  UPLOAD_URL_TTL_MS,
} from "@invessiv/common/constants/files/upload-limits";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { FileOperationErrorCode } from "@invessiv/common/contracts/files/file-operation-error-code";
import type { UploadClassification } from "@invessiv/common/contracts/files/upload-classification";
import type { StorageUploadTicket } from "@invessiv/common/contracts/storage/storage-upload-ticket";
import {
  createFileStorageKey,
  sanitizeFilename,
} from "@invessiv/common/patterns/files/safe-filename";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import { StorageError } from "@invessiv/storage";
import { FILE_ACTIVITY_ENTITY } from "@/common/constants/files/file-activity-metadata";
import { activityService } from "@/server/shared/services/activity-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import type {
  FileDownload,
  FileLinkInput,
  FileRow,
  PendingUploadInput,
} from "./file-object-service-types";
import { fileValidationService } from "./file-validation-service";
import { storageService } from "./storage-service";

type AcceptedUpload = Extract<UploadClassification, { ok: true }>;
type FileActivityActor = {
  type: typeof ActorType.User | typeof ActorType.Customer;
  userId: string;
};

/** Keeps names, URLs and storage coordinates out of both timelines. */
async function recordActivity(
  tx: ContactDatabaseTransaction,
  row: FileRow,
  actor: FileActivityActor,
  type: ActivityType,
  fields?: readonly string[],
) {
  await activityService.createActivity(tx, {
    customerId: row.customer_id,
    projectId: row.project_id,
    actor,
    type,
    metadata: {
      entity: FILE_ACTIVITY_ENTITY,
      file_id: row.id,
      ...(fields ? { fields: [...fields] } : {}),
    },
  });
}

/** The caller has already authorized the customer, project and visibility. */
async function createLink(
  tx: ContactDatabaseTransaction,
  input: FileLinkInput,
): Promise<FileRow> {
  const [row] = await tx
    .insert(files)
    .values({
      id: crypto.randomUUID(),
      customer_id: input.customerId,
      project_id: input.projectId,
      source: FileSource.Link,
      status: FileStatus.Ready,
      asset_kind: AssetKind.Link,
      display_name: input.displayName,
      note: input.note,
      url: input.url,
      visible_to_customer: input.visibleToCustomer,
      uploaded_by_side: input.uploader.side,
      uploaded_by_member_id: input.uploader.memberId,
      uploaded_by_portal_membership_id: input.uploader.portalMembershipId,
      version: 1,
    })
    .returning();
  return row;
}

/**
 * Signs first and inserts afterwards, so a failed signature never consumes a pending slot. The
 * caller has already authorized the target and counted the uploader's pending slots.
 */
async function issueUpload(
  tx: ContactDatabaseTransaction,
  input: PendingUploadInput,
  candidate: AcceptedUpload,
): Promise<{ row: FileRow; ticket: StorageUploadTicket }> {
  const id = crypto.randomUUID();
  const key = createFileStorageKey(input.customerId, id, input.displayName);
  const ticket = await storageService.getAdapter().createUploadUrl(key, {
    contentType: candidate.contentType,
    maxBytes: candidate.maxBytes,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_MS),
  });
  const [row] = await tx
    .insert(files)
    .values({
      id,
      customer_id: input.customerId,
      project_id: input.projectId,
      source: FileSource.Upload,
      status: FileStatus.Pending,
      asset_kind: candidate.assetKind,
      display_name: input.displayName,
      note: input.note,
      visible_to_customer: input.visibleToCustomer,
      uploaded_by_side: input.uploader.side,
      uploaded_by_member_id: input.uploader.memberId,
      uploaded_by_portal_membership_id: input.uploader.portalMembershipId,
      storage_key: key,
      content_type: candidate.contentType,
      extension: candidate.extension,
      size_bytes: input.sizeBytes,
      inspection_status: FileInspectionStatus.Unscanned,
      version: 1,
    })
    .returning();
  return { row, ticket };
}

/** Called only while holding the file row lock. Retains the key when storage is unavailable. */
async function remove(
  tx: ContactDatabaseTransaction,
  row: FileRow,
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
        toDto: (current) => current,
      });
      if (!marked.ok) throw new Error("Locked file disappeared during cleanup");
      console.error("[files] storage cleanup deferred", {
        code: FileApiErrorCode.StorageUnavailable,
      });
      return false;
    }
  }
  await tx.delete(files).where(eq(files.id, row.id));
  return true;
}

/**
 * Checks the stored object of a locked pending upload and marks it ready. Refused content is
 * removed from storage and database; a repeated call on a ready row returns it unchanged.
 */
async function finalizeUpload(
  tx: ContactDatabaseTransaction,
  row: FileRow,
): Promise<
  | { ok: true; row: FileRow; completed: boolean }
  | { ok: false; code: FileOperationErrorCode }
> {
  if (row.status === FileStatus.Ready)
    return { ok: true, row, completed: false };
  if (!row.storage_key || !row.extension || !row.size_bytes)
    throw new Error("Pending upload is missing its storage coordinates");
  const validation = await fileValidationService.validate(
    storageService.getAdapter(),
    {
      storageKey: row.storage_key,
      extension: row.extension,
      sizeBytes: row.size_bytes,
    },
  );
  if (!validation.ok) {
    if (!(await remove(tx, row)))
      return { ok: false, code: FileApiErrorCode.StorageUnavailable };
    return validation;
  }
  const write = await updateVersioned({
    tx,
    table: files,
    id: row.id,
    expectedVersion: row.version,
    patch: {
      status: FileStatus.Ready,
      inspection_status: validation.inspectionStatus,
    },
    toDto: (current) => current,
  });
  if (!write.ok) throw new Error("Locked upload disappeared during completion");
  return { ok: true, row: write.value, completed: true };
}

/**
 * A short-lived URL for a readable upload. Stores that cannot set the download name get the
 * caller's authenticated proxy route instead.
 */
async function createDownloadUrl(
  row: FileRow,
  disposition: StorageDisposition,
  proxyUrl: string,
): Promise<string | null> {
  if (!row.storage_key) return null;
  try {
    return await storageService
      .getAdapter()
      .createDownloadUrl(row.storage_key, {
        expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_MS),
        disposition,
        filename: sanitizeFilename(row.display_name),
      });
  } catch (error) {
    if (
      error instanceof StorageError &&
      error.code === StorageErrorCode.ProxyRequired
    )
      return proxyUrl;
    throw error;
  }
}

async function openDownload(row: FileRow): Promise<FileDownload | null> {
  if (!row.storage_key || !row.content_type) return null;
  return {
    stream: await storageService.getAdapter().openReadStream(row.storage_key),
    filename: sanitizeFilename(row.display_name),
    contentType: row.content_type,
  };
}

export const fileObjectService = {
  recordActivity,
  createLink,
  issueUpload,
  finalizeUpload,
  remove,
  createDownloadUrl,
  openDownload,
};
