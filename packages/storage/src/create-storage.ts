import "server-only";
import { StorageProvider } from "@invessiv/common/constants/storage/storage-options";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import { StorageError } from "./storage-error";
import { createVercelBlobStorage } from "./adapters/vercel-blob-storage";

export function createStorage(): StorageAdapter {
  if (
    process.env.STORAGE_PROVIDER !== StorageProvider.VercelBlob ||
    !(
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
    )
  )
    throw new StorageError(StorageErrorCode.Configuration);
  return createVercelBlobStorage();
}
