import type { StorageDisposition } from "../../constants/storage/storage-options";

export interface StorageDownloadOptions {
  expiresAt: Date;
  disposition: StorageDisposition;
  filename: string;
  /** Immutable objects only: lets the CDN and the browser reuse the response. */
  cacheable?: boolean;
}
