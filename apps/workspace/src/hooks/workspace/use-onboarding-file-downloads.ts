"use client";

import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import { filesApiService } from "@/client/crm/files-api-service";
import { useFileDownloads } from "@/hooks/shared/use-file-downloads";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";

/**
 * Download and preview of the files attached to a form, through the internal file endpoints. The
 * form only carries the files this member may read; nothing is selected, so there is no archive.
 */
export function useOnboardingFileDownloads(
  customerId: string,
  errors: CrmFilesDictionary["errors"],
) {
  return useFileDownloads<FeedbackAttachmentDto>({
    archiveFilename: "",
    errors,
    selectedIds: [],
    clearSelection: () => undefined,
    getDownloadUrl: filesApiService.getDownloadUrl,
    readText: filesApiService.readText,
    getArchive: (ids) => filesApiService.downloadArchive(customerId, ids),
  });
}
