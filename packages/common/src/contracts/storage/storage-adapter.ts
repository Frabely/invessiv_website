import type { StorageUploadOptions } from "./storage-upload-options";
import type { StorageDownloadOptions } from "./storage-download-options";
import type { StorageUploadTicket } from "./storage-upload-ticket";
import type { StorageObjectMetadata } from "./storage-object-metadata";

export interface StorageAdapter {
  createUploadUrl(
    key: string,
    options: StorageUploadOptions,
  ): Promise<StorageUploadTicket>;

  head(key: string): Promise<StorageObjectMetadata | null>;

  readRange(
    key: string,
    start: number,
    endInclusive: number,
  ): Promise<Uint8Array>;

  createDownloadUrl(
    key: string,
    options: StorageDownloadOptions,
  ): Promise<string>;

  openReadStream(key: string): Promise<ReadableStream<Uint8Array>>;

  delete(key: string): Promise<void>;
}
