"use client";

import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import { useFileDownloads } from "@/hooks/shared/use-file-downloads";

type ArchiveOptions = {
  filename: string;
  selectedIds: readonly string[];
  clearSelection: () => void;
};

/** Portal file endpoints for both the file library and feedback attachments. */
export function usePortalFileDownloads<TFile extends { id: string }>(
  customerId: string,
  errors: Record<FileClientErrorCode, string>,
  archive?: ArchiveOptions,
) {
  return useFileDownloads<TFile>({
    archiveFilename: archive?.filename ?? "",
    errors,
    selectedIds: archive?.selectedIds ?? [],
    clearSelection: archive?.clearSelection ?? (() => undefined),
    getDownloadUrl: (fileId, disposition) =>
      portalFilesApiService.getDownloadUrl(customerId, fileId, disposition),
    readText: (fileId) => portalFilesApiService.readText(customerId, fileId),
    getArchive: (ids) => portalFilesApiService.downloadArchive(customerId, ids),
  });
}
