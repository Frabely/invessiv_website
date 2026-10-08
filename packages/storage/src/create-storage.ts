import "server-only";
import { StorageProvider } from "@invessiv/common/constants/storage/storage-options";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import { StorageError } from "./storage-error";
import { createVercelBlobStorage } from "./adapters/vercel-blob-storage";

export function createStorage(): StorageAdapter {
  if (
    process.env.STORAGE_PROVIDER !== StorageProvider.VercelBlob ||
    !(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
  )
    throw new StorageError(StorageErrorCode.Configuration);
  // The SDK resolves OIDC from Vercel's request context as well as the environment.
  // A store ID selects the store; the SDK still authenticates every operation.
  return createVercelBlobStorage();
}
