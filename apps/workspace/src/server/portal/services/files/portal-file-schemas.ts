import "server-only";
import { z } from "zod";
import { PORTAL_FILE_ORIGIN_VALUES } from "@invessiv/common/constants/portal/portal-file-origin";
import { fileRequestSchemas as shared } from "@/server/shared/files/file-request-schemas";

/** No visibility and no version fields: the portal neither releases nor edits entries. */
export const portalFileSchemas = {
  id: shared.id,
  list: z.strictObject({
    page: shared.page,
    pageSize: shared.pageSize,
    origin: z.enum(PORTAL_FILE_ORIGIN_VALUES),
  }),
  upload: z.strictObject({
    displayName: shared.displayName,
    sizeBytes: shared.sizeBytes,
    projectId: shared.projectId,
    note: shared.note,
  }),
  link: z.strictObject({
    displayName: shared.displayName,
    url: shared.linkUrl,
    projectId: shared.projectId,
    note: shared.note,
  }),
  archive: shared.archive,
};
