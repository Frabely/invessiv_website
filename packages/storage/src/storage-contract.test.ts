import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInMemoryStorage } from "./testing/in-memory-storage";
import { createVercelBlobStorage } from "./adapters/vercel-blob-storage";
import { createStorage } from "./create-storage";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const state = vi.hoisted(() => ({
  objects: new Map<string, { bytes: Uint8Array; contentType: string }>(),
  issue: vi.fn(),
  sign: vi.fn(),
  head: vi.fn(),
  del: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@vercel/blob", () => ({
  issueSignedToken: state.issue,
  presignUrl: state.sign,
  head: state.head,
  del: state.del,
  getDownloadUrl: (url: string) => url + "&download=1",
  BlobNotFoundError: class extends Error {},
}));
const key = "objects/Grüße.txt";
const bytes = new TextEncoder().encode("hello storage");
const contentType = "text/plain";
const upload = () => ({
  contentType,
  maxBytes: 100,
  expiresAt: new Date(Date.now() + 60_000),
});
const download = () => ({
  filename: "Grüße.txt",
  disposition: StorageDisposition.Attachment,
  expiresAt: new Date(Date.now() + 60_000),
});
beforeEach(() => {
  state.objects.clear();
  vi.clearAllMocks();
  state.issue.mockImplementation(async () => ({
    delegationToken: "secret",
    clientSigningToken: "secret",
    validUntil: Date.now() + 3_600_000,
  }));
  state.sign.mockImplementation(async (_token, options) => ({
    presignedUrl:
      "https://store.private.blob.vercel-storage.com/" +
      encodeURIComponent(options.pathname) +
      "?expires=" +
      options.validUntil,
  }));
  state.head.mockImplementation(async (path: string) => {
    const object = state.objects.get(path);
    if (!object) {
      const { BlobNotFoundError } = await import("@vercel/blob");
      throw new BlobNotFoundError();
    }
    return {
      size: object.bytes.length,
      contentType: object.contentType,
      url: "https://store.private.blob.vercel-storage.com/" + path,
    };
  });
  state.del.mockImplementation(async (path: string) => {
    state.objects.delete(path);
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      const object = state.objects.get(
        decodeURIComponent(new URL(url).pathname.slice(1)),
      );
      if (!object)
        return new Response(null, { status: HttpResponseCode.NotFound });
      const range = new Headers(options?.headers).get(HttpHeaderName.Range);
      if (range) {
        const [, a, b] = /^bytes=(\d+)-(\d+)$/.exec(range)!;
        return new Response(object.bytes.slice(Number(a), Number(b) + 1), {
          status: HttpResponseCode.PartialContent,
          headers: {
            [HttpHeaderName.ContentRange]: `bytes ${a}-${b}/${object.bytes.length}`,
          },
        });
      }
      return new Response(object.bytes.slice(), {
        status: HttpResponseCode.Ok,
      });
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe.each(["memory", "vercel"])("%s storage contract", (kind) => {
  function fixture() {
    if (kind === "memory") return createInMemoryStorage();
    return {
      adapter: createVercelBlobStorage(),
      seed: (path: string, data: Uint8Array, type: string) =>
        state.objects.set(path, { bytes: data, contentType: type }),
    };
  }

  it("signs uploads with explicit content type and verb", async () => {
    const { adapter } = fixture();
    const result = await adapter.createUploadUrl(key, upload());
    expect(result.method).toBe(HttpMethod.Put);
    expect(result.headers).toEqual({
      [HttpHeaderName.ContentType]: contentType,
    });
    expect(new URL(result.url).protocol).toBe("https:");
  });
  it("reads metadata, inclusive ranges and streams; deletes idempotently", async () => {
    const { adapter, seed } = fixture();
    expect(await adapter.head(key)).toBeNull();
    seed(key, bytes, contentType);
    expect(await adapter.head(key)).toEqual({
      size: bytes.length,
      contentType,
    });
    expect(await adapter.readRange(key, 1, 3)).toEqual(bytes.slice(1, 4));
    expect(await new Response(await adapter.openReadStream(key)).text()).toBe(
      "hello storage",
    );
    expect(await adapter.createDownloadUrl(key, download())).toContain(
      "https://",
    );
    await adapter.delete(key);
    await adapter.delete(key);
    expect(await adapter.head(key)).toBeNull();
    await expect(adapter.openReadStream(key)).rejects.toMatchObject({
      code: StorageErrorCode.NotFound,
    });
  });
  it("rejects invalid ranges, keys, limits and expiry", async () => {
    const { adapter } = fixture();
    await expect(adapter.readRange(key, -1, 3)).rejects.toMatchObject({
      code: StorageErrorCode.InvalidInput,
    });
    await expect(
      adapter.createUploadUrl("../bad", upload()),
    ).rejects.toMatchObject({ code: StorageErrorCode.InvalidInput });
    await expect(
      adapter.createUploadUrl(key, { ...upload(), maxBytes: 0 }),
    ).rejects.toMatchObject({ code: StorageErrorCode.InvalidInput });
    await expect(
      adapter.createUploadUrl(key, { ...upload(), expiresAt: new Date(0) }),
    ).rejects.toMatchObject({ code: StorageErrorCode.InvalidInput });
    await expect(
      adapter.createDownloadUrl(key, {
        ...download(),
        expiresAt: new Date(Date.now() + 600_000),
      }),
    ).rejects.toMatchObject({ code: StorageErrorCode.InvalidInput });
  });
});

describe("Vercel private adapter", () => {
  it("signs private non-overwriting PUTs with CDN constraints", async () => {
    const adapter = createVercelBlobStorage();
    const options = upload();
    await adapter.createUploadUrl(key, options);
    expect(state.sign).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        operation: "put",
        access: "private",
        pathname: key,
        allowedContentTypes: [contentType],
        maximumSizeInBytes: 100,
        allowOverwrite: false,
        addRandomSuffix: false,
        validUntil: options.expiresAt.getTime(),
      }),
    );
  });
  it("shares concurrent token issuance and refreshes before expiry", async () => {
    vi.useFakeTimers();
    const adapter = createVercelBlobStorage();
    await Promise.all([
      adapter.createUploadUrl(key, upload()),
      adapter.createDownloadUrl(key, download()),
    ]);
    expect(state.issue).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3_550_000);
    await adapter.createUploadUrl(key, upload());
    expect(state.issue).toHaveBeenCalledTimes(2);
  });
  it("recovers failed token issuance without leaking provider errors", async () => {
    state.issue.mockRejectedValueOnce(new Error("secret signed-url"));
    const adapter = createVercelBlobStorage();
    await expect(adapter.createUploadUrl(key, upload())).rejects.toMatchObject({
      code: StorageErrorCode.Unavailable,
      message: "Storage operation failed.",
    });
    await adapter.createUploadUrl(key, upload());
    expect(state.issue).toHaveBeenCalledTimes(2);
  });
  it("requires a proxy for SVG attachments and renamed downloads", async () => {
    const adapter = createVercelBlobStorage();
    await expect(
      adapter.createDownloadUrl("objects/a.svg", {
        ...download(),
        filename: "a.svg",
      }),
    ).rejects.toMatchObject({ code: StorageErrorCode.ProxyRequired });
    await expect(
      adapter.createDownloadUrl(key, { ...download(), filename: "other.txt" }),
    ).rejects.toMatchObject({ code: StorageErrorCode.ProxyRequired });
  });
  it("rejects public stores and unbounded or truncated range responses", async () => {
    const adapter = createVercelBlobStorage();
    state.head.mockResolvedValueOnce({
      size: 1,
      contentType,
      url: "https://store.public.blob.vercel-storage.com/a",
    });
    await expect(adapter.head(key)).rejects.toMatchObject({
      code: StorageErrorCode.Configuration,
    });
    for (const response of [
      new Response(bytes, { status: HttpResponseCode.Ok }),
      new Response(bytes, {
        status: HttpResponseCode.PartialContent,
        headers: { [HttpHeaderName.ContentRange]: "bytes 0-1/100" },
      }),
      new Response(new Uint8Array([1]), {
        status: HttpResponseCode.PartialContent,
        headers: { [HttpHeaderName.ContentRange]: "bytes 0-1/100" },
      }),
    ]) {
      vi.mocked(fetch).mockResolvedValueOnce(response);
      await expect(adapter.readRange(key, 0, 1)).rejects.toMatchObject({
        code: StorageErrorCode.InvalidRange,
      });
    }
  });
  it("requires explicit configuration in every environment", () => {
    vi.stubEnv("STORAGE_PROVIDER", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => createStorage()).toThrow("Private storage is not configured.");
    vi.stubEnv("STORAGE_PROVIDER", "memory");
    expect(() => createStorage()).toThrow();
    vi.stubEnv("STORAGE_PROVIDER", "vercel-blob");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "");
    expect(() => createStorage()).toThrow();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-only");
    expect(createStorage()).toHaveProperty("readRange");
  });
});
