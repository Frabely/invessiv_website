import "server-only";
import {
  BlobNotFoundError,
  del,
  getDownloadUrl,
  head,
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { StorageError } from "../storage-error";
import { createIdleAbort } from "../idle-abort";
import {
  validateDownload,
  validateKey,
  validateRange,
  validateUpload,
} from "../storage-validation";

export function createVercelBlobStorage(): StorageAdapter {
  let cached: Awaited<ReturnType<typeof issueSignedToken>> | undefined;
  let issuing: ReturnType<typeof issueSignedToken> | undefined;

  async function token(expiresAt: number) {
    if (cached && cached.validUntil > Math.max(expiresAt, Date.now() + 60_000))
      return cached;
    if (!issuing) {
      issuing = issueSignedToken({
        operations: ["get", "put"],
        validUntil: Date.now() + 3_600_000,
      })
        .then((value) => {
          cached = value;
          return value;
        })
        .finally(() => {
          issuing = undefined;
        });
    }
    return issuing;
  }

  async function safe<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if (error instanceof BlobNotFoundError)
        throw new StorageError(StorageErrorCode.NotFound);
      // Provider errors can contain signed URLs and credentials; never propagate them.
      throw new StorageError(StorageErrorCode.Unavailable);
    }
  }

  // A flat AbortSignal.timeout would bound the whole read, including body
  // streaming — a large, slowly-but-actively downloading object (video up
  // to 200 MB) would then be aborted mid-transfer for making progress too
  // slowly rather than for stalling. createIdleAbort resets on every chunk
  // instead, so only genuine inactivity (no bytes for READ_IDLE_TIMEOUT_MS)
  // aborts.
  const READ_IDLE_TIMEOUT_MS = 30_000;

  async function read(key: string, range?: string) {
    const validUntil = Date.now() + 60_000;
    const { presignedUrl } = await presignUrl(await token(validUntil), {
      operation: "get",
      pathname: key,
      access: "private",
      validUntil,
      useCache: false,
    });
    const idle = createIdleAbort(READ_IDLE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(presignedUrl, {
        headers: range ? { [HttpHeaderName.Range]: range } : undefined,
        cache: "no-store",
        redirect: "error",
        signal: idle.signal,
      });
    } catch (error) {
      idle.dispose();
      throw error;
    }
    if (response.status === HttpResponseCode.NotFound) {
      idle.dispose();
      await response.body?.cancel();
      throw new StorageError(StorageErrorCode.NotFound);
    }
    if (!response.ok || !response.body) {
      idle.dispose();
      await response.body?.cancel();
      throw new StorageError(StorageErrorCode.Unavailable);
    }
    return { response, idle };
  }

  return {
    async createUploadUrl(key, options) {
      validateUpload(key, options);
      return safe(async () => {
        const { presignedUrl } = await presignUrl(
          await token(options.expiresAt.getTime()),
          {
            operation: "put",
            pathname: key,
            access: "private",
            validUntil: options.expiresAt.getTime(),
            allowedContentTypes: [options.contentType],
            maximumSizeInBytes: options.maxBytes,
            allowOverwrite: false,
            addRandomSuffix: false,
            cacheControlMaxAge: 60,
          },
        );
        return {
          url: presignedUrl,
          method: HttpMethod.Put,
          headers: { [HttpHeaderName.ContentType]: options.contentType },
        };
      });
    },
    async head(key) {
      validateKey(key);
      return safe(async () => {
        try {
          const metadata = await head(key);
          if (
            !new URL(metadata.url).hostname.endsWith(
              ".private.blob.vercel-storage.com",
            )
          )
            throw new StorageError(StorageErrorCode.Configuration);
          return { size: metadata.size, contentType: metadata.contentType };
        } catch (error) {
          if (error instanceof BlobNotFoundError) return null;
          throw error;
        }
      });
    },
    async readRange(key, start, endInclusive) {
      validateRange(key, start, endInclusive);
      return safe(async () => {
        const { response, idle } = await read(
          key,
          `bytes=${start}-${endInclusive}`,
        );
        try {
          const header = response.headers.get(HttpHeaderName.ContentRange);
          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(header ?? "");
          if (
            response.status !== HttpResponseCode.PartialContent ||
            !match ||
            Number(match[1]) !== start ||
            Number(match[2]) !== endInclusive ||
            Number(match[3]) <= endInclusive
          ) {
            await response.body!.cancel();
            throw new StorageError(StorageErrorCode.InvalidRange);
          }
          const expected = endInclusive - start + 1;
          const bytes = new Uint8Array(expected);
          const reader = response.body!.getReader();
          let offset = 0;
          try {
            for (;;) {
              const { done, value } = await reader.read();
              idle.keepAlive();
              if (done) break;
              if (offset + value.length > expected)
                throw new StorageError(StorageErrorCode.InvalidRange);
              bytes.set(value, offset);
              offset += value.length;
            }
          } finally {
            await reader.cancel();
            reader.releaseLock();
          }
          if (offset !== expected)
            throw new StorageError(StorageErrorCode.InvalidRange);
          return bytes;
        } finally {
          idle.dispose();
        }
      });
    },
    async createDownloadUrl(key, options) {
      validateDownload(key, options);
      // The SDK has no response filename/disposition override. SVG needs a sandboxed app response.
      if (
        key.split("/").pop() !== options.filename ||
        (key.toLowerCase().endsWith(".svg") &&
          options.disposition === StorageDisposition.Attachment)
      )
        throw new StorageError(StorageErrorCode.ProxyRequired);
      return safe(async () => {
        const { presignedUrl } = await presignUrl(
          await token(options.expiresAt.getTime()),
          {
            operation: "get",
            pathname: key,
            access: "private",
            validUntil: options.expiresAt.getTime(),
            useCache: false,
          },
        );
        return options.disposition === StorageDisposition.Attachment
          ? getDownloadUrl(presignedUrl)
          : presignedUrl;
      });
    },
    async openReadStream(key) {
      validateKey(key);
      return safe(async () => {
        const { response, idle } = await read(key);
        const reader = response.body!.getReader();
        return new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              idle.keepAlive();
              if (done) {
                idle.dispose();
                reader.releaseLock();
                controller.close();
              } else controller.enqueue(value);
            } catch {
              idle.dispose();
              reader.releaseLock();
              controller.error(new StorageError(StorageErrorCode.Unavailable));
            }
          },
          async cancel() {
            idle.dispose();
            try {
              await reader.cancel();
            } finally {
              reader.releaseLock();
            }
          },
        });
      });
    },
    async delete(key) {
      validateKey(key);
      return safe(async () => {
        try {
          await del(key);
        } catch (error) {
          if (!(error instanceof BlobNotFoundError)) throw error;
        }
      });
    },
  };
}
