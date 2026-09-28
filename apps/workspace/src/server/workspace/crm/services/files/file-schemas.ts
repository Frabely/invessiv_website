import { z } from "zod";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { FILE_ORIGIN_VALUES } from "@invessiv/common/constants/files/file-origin";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";

const fields = {
  projectId: z.uuid().nullable().optional(),
  visibleToCustomer: z.boolean().optional(),
  note: z.string().trim().max(200).nullable().optional(),
};
const displayName = z.string().trim().min(1).max(255);
const version = z.int().positive();
export const fileSchemas = {
  id: z.uuid(),
  upload: z.strictObject({
    ...fields,
    displayName,
    sizeBytes: z.int().positive(),
  }),
  link: z.strictObject({
    ...fields,
    displayName,
    url: z.string().refine(validateFileLink),
  }),
  update: z
    .strictObject({ ...fields, version })
    .refine((input) => Object.keys(fields).some((key) => key in input)),
  delete: z.strictObject({ version }),
  list: z.strictObject({
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    projectId: z.uuid().nullable().optional(),
    assetKind: z.enum(ASSET_KIND_VALUES).optional(),
    origin: z.enum(FILE_ORIGIN_VALUES).optional(),
    search: z.string().trim().max(200).optional(),
  }),
  disposition: z
    .enum(StorageDisposition)
    .default(StorageDisposition.Attachment),
};
