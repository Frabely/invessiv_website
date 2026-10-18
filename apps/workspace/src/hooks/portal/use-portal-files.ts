"use client";

import type { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import { usePagedFiles } from "@/hooks/shared/use-paged-files";

/**
 * The portal files list for one origin (or both). The server-rendered first page is used only for
 * the origin and project it was rendered for; `revision` reloads after an upload or a new link.
 */
export function usePortalFiles(
  customerId: string,
  origin: PortalFileOrigin | null,
  revision: number,
  initial: {
    origin: PortalFileOrigin | null;
    page: PortalFileListPageDto;
    projectId: string | null;
  },
  projectId: string | null = null,
) {
  return usePagedFiles<PortalFileDto>(
    JSON.stringify([customerId, origin, revision, projectId]),
    (page) =>
      portalFilesApiService.listFiles(customerId, origin, page, projectId),
    initial.origin === origin &&
      initial.projectId === projectId &&
      revision === 0
      ? initial.page
      : undefined,
  );
}
