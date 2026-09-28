import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { StorageError } from "../storage-error";
import {
  validateDownload,
  validateKey,
  validateRange,
  validateUpload,
} from "../storage-validation";

/** Test fixture only; never selected by the production factory. */
export function createInMemoryStorage() {
  const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();

  function required(key: string) {
    validateKey(key);
    const object = objects.get(key);
    if (!object) throw new StorageError(StorageErrorCode.NotFound);
    return object;
  }

  const adapter: StorageAdapter = {
    async createUploadUrl(key, options) {
      validateUpload(key, options);
      return {
        url: `https://storage.invalid/${encodeURIComponent(key)}?expires=${options.expiresAt.getTime()}`,
        method: HttpMethod.Put,
        headers: { [HttpHeaderName.ContentType]: options.contentType },
      };
    },
    async head(key) {
      validateKey(key);
      const object = objects.get(key);
      return object
        ? { size: object.bytes.length, contentType: object.contentType }
        : null;
    },
    async readRange(key, start, end) {
      validateRange(key, start, end);
      const object = required(key);
      if (end >= object.bytes.length)
        throw new StorageError(StorageErrorCode.InvalidRange);
      return object.bytes.slice(start, end + 1);
    },
    async createDownloadUrl(key, options) {
      validateDownload(key, options);
      return `https://storage.invalid/${encodeURIComponent(key)}?expires=${options.expiresAt.getTime()}&disposition=${options.disposition}&filename=${encodeURIComponent(options.filename)}`;
    },
    async openReadStream(key) {
      const bytes = required(key).bytes.slice();
      return new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
    },
    async delete(key) {
      validateKey(key);
      objects.delete(key);
    },
  };
  return {
    adapter,
    seed(key: string, bytes: Uint8Array, contentType: string) {
      validateKey(key);
      objects.set(key, { bytes: bytes.slice(), contentType });
    },
  };
}
