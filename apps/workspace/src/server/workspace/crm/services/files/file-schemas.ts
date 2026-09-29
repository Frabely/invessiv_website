import { z } from "zod";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { FILE_ORIGIN_VALUES } from "@invessiv/common/constants/files/file-origin";
import { fileRequestSchemas as shared } from "@/server/shared/files/file-request-schemas";

const fields = {
  projectId: shared.projectId,
  visibleToCustomer: z.boolean().optional(),
  note: shared.note,
};
const version = z.int().positive();
export const fileSchemas = {
  id: shared.id,
  upload: z.strictObject({
    ...fields,
    displayName: shared.displayName,
    sizeBytes: shared.sizeBytes,
  }),
  link: z.strictObject({
    ...fields,
    displayName: shared.displayName,
    url: shared.linkUrl,
  }),
  update: z
    .strictObject({ ...fields, version })
    .refine((input) => Object.keys(fields).some((key) => key in input)),
  delete: z.strictObject({ version }),
  archive: shared.archive,
  list: z.strictObject({
    page: shared.page,
    pageSize: shared.pageSize,
    projectId: shared.projectId,
    assetKind: z.enum(ASSET_KIND_VALUES).optional(),
    origin: z.enum(FILE_ORIGIN_VALUES).optional(),
    search: z.string().trim().max(200).optional(),
    shareable: z.boolean().optional(),
  }),
  disposition: shared.disposition,
};
