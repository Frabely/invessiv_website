import type { StorageDisposition } from "../../constants/storage/storage-options";

export interface StorageDownloadOptions {
  expiresAt: Date;
  disposition: StorageDisposition;
  filename: string;
}
