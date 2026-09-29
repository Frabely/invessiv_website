"use client";

import type { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import { usePagedFiles } from "@/hooks/shared/use-paged-files";

/**
 * One tab of the portal files page. The server-rendered first page is used only for the tab it
 * was rendered for; `revision` reloads after an upload or a new link.
 */
export function usePortalFiles(
  customerId: string,
  origin: PortalFileOrigin,
  revision: number,
  initial: { origin: PortalFileOrigin; page: PortalFileListPageDto },
) {
  return usePagedFiles<PortalFileDto>(
    JSON.stringify([customerId, origin, revision]),
    (page) => portalFilesApiService.listFiles(customerId, origin, page),
    initial.origin === origin && revision === 0 ? initial.page : undefined,
  );
}
