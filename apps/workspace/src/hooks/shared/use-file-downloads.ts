import { useState } from "react";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import { browserDownload } from "@/lib/files/browser-download";

/** Shared browser behavior; the caller supplies its own authorized API methods. */
export function useFileDownloads<TFile extends { id: string }>(input: {
  archiveFilename: string;
  errors: Record<FileClientErrorCode, string>;
  selectedIds: readonly string[];
  clearSelection: () => void;
  getDownloadUrl: (
    fileId: string,
    disposition: StorageDisposition,
  ) => Promise<FileClientResult<string>>;
  readText: (fileId: string) => Promise<FileClientResult<string>>;
  getArchive: (ids: readonly string[]) => Promise<FileClientResult<Blob>>;
}) {
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function download(file: TFile) {
    setActionError(null);
    const result = await input.getDownloadUrl(
      file.id,
      StorageDisposition.Attachment,
    );
    if (!result.ok) {
      setActionError(input.errors[result.code]);
      return;
    }
    browserDownload.openUrl(result.value);
  }

  async function loadPreview(file: TFile, kind: FilePreviewKind) {
    // Text uses the authenticated route and does not depend on storage CORS.
    const result =
      kind === FilePreviewKind.Text
        ? await input.readText(file.id)
        : await input.getDownloadUrl(file.id, StorageDisposition.Inline);
    return result.ok ? result.value : null;
  }

  async function downloadArchive() {
    if (!input.selectedIds.length || archiveBusy) return;
    setArchiveBusy(true);
    setActionError(null);
    try {
      const result = await input.getArchive(input.selectedIds);
      if (!result.ok) {
        // A stale selection blocks the entire archive; clear it when a file disappeared.
        if (result.code === FileApiErrorCode.NotFound) input.clearSelection();
        setActionError(input.errors[result.code]);
        return;
      }
      browserDownload.saveBlob(result.value, input.archiveFilename);
      input.clearSelection();
    } finally {
      setArchiveBusy(false);
    }
  }

  return { archiveBusy, actionError, download, loadPreview, downloadArchive };
}
