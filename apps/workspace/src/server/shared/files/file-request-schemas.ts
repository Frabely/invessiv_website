import "server-only";
import { z } from "zod";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";

/** Request fields that CRM and portal file routes validate identically. */
export const fileRequestSchemas = {
  id: z.uuid(),
  projectId: z.uuid().nullable().optional(),
  note: z.string().trim().max(200).nullable().optional(),
  displayName: z.string().trim().min(1).max(255),
  sizeBytes: z.int().positive(),
  linkUrl: z.string().refine(validateFileLink),
  archive: z.strictObject({
    fileIds: z
      .array(z.uuid())
      .min(1)
      .max(MAX_ARCHIVE_FILES)
      .refine((ids) => new Set(ids).size === ids.length),
  }),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  disposition: z
    .enum(StorageDisposition)
    .default(StorageDisposition.Attachment),
};
