import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { after } from "next/server";
import sharp from "sharp";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { DOWNLOAD_URL_TTL_MS } from "@invessiv/common/constants/files/upload-limits";
import { FILE_THUMBNAIL_EXTENSIONS } from "@invessiv/common/constants/files/file-thumbnail-extensions";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import { StorageError } from "@invessiv/storage";
import { FileThumbnailOutcome } from "@/common/constants/files/file-thumbnail-outcome";
import type { FileRow } from "./file-object-service-types";
import { storageService } from "./storage-service";

// Sharp for 44px rows at 3x density; the preview panel only shows it until the original loads.
const THUMBNAIL_EDGE_PX = 160;
const THUMBNAIL_QUALITY = 70;
const THUMBNAIL_SUFFIX = ".thumb.webp";
const THUMBNAIL_CONTENT_TYPE = "image/webp";
// The key derives from the immutable original, so the bytes behind it never change.
const THUMBNAIL_CACHE_SECONDS = 365 * 24 * 60 * 60;
const RENDER_FAILED = "thumbnail_render_failed";
const SIGNED_URL_WINDOW_MS = 2 * 60_000;
// The prebuilt sharp cannot decode HEIC/HEIF; SVG originals are small and render directly.
const THUMBNAIL_EXTENSIONS: ReadonlySet<string> = new Set(
  FILE_THUMBNAIL_EXTENSIONS,
);

function isEligible(row: FileRow): row is FileRow & { storage_key: string } {
  return (
    row.source === FileSource.Upload &&
    row.status === FileStatus.Ready &&
    row.asset_kind === AssetKind.Image &&
    row.orphaned_at === null &&
    row.thumbnail_key === null &&
    row.storage_key !== null &&
    row.extension !== null &&
    THUMBNAIL_EXTENSIONS.has(row.extension)
  );
}

/**
 * Sharp collects stream input completely before decoding, so the original is read into memory
 * either way (at most 40 MB). JPEG shrink-on-load keeps the decoded raster small.
 */
async function render(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const input = Buffer.from(await new Response(stream).arrayBuffer());
  return sharp(input, { failOn: "error" })
    .rotate()
    .resize(THUMBNAIL_EDGE_PX, THUMBNAIL_EDGE_PX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();
}

/**
 * Writes the preview object of an eligible image and returns its key; null when the file gets
 * no preview. Sharp drops EXIF data, so no GPS position of a phone photo reaches the preview.
 */
async function create(
  adapter: StorageAdapter,
  row: FileRow,
): Promise<string | null> {
  if (!isEligible(row)) return null;
  const key = row.storage_key + THUMBNAIL_SUFFIX;
  const bytes = await render(await adapter.openReadStream(row.storage_key));
  await adapter.put(key, new Uint8Array(bytes), {
    contentType: THUMBNAIL_CONTENT_TYPE,
    cacheMaxAgeSeconds: THUMBNAIL_CACHE_SECONDS,
  });
  return key;
}

/**
 * A technical column: written without a version bump, so an edit right after the upload never
 * meets a conflict it did not cause. A row that was removed meanwhile gets its object deleted.
 */
async function attach(row: FileRow, key: string): Promise<boolean> {
  const [attached] = await getDrizzleDatabaseClient()
    .update(files)
    .set({ thumbnail_key: key })
    .where(
      and(
        eq(files.id, row.id),
        eq(files.storage_key, row.storage_key!),
        eq(files.status, FileStatus.Ready),
        isNull(files.orphaned_at),
        or(isNull(files.thumbnail_key), eq(files.thumbnail_key, key)),
      ),
    )
    .returning({ id: files.id });
  if (attached) return true;
  await storageService.getAdapter().delete(key);
  return false;
}

/** Never throws: a file without a preview simply keeps its kind icon. */
async function generate(fileId: string): Promise<FileThumbnailOutcome> {
  try {
    const [row] = await getDrizzleDatabaseClient()
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    if (!row || !isEligible(row)) return FileThumbnailOutcome.Skipped;
    const key = await create(storageService.getAdapter(), row);
    if (!key || !(await attach(row, key))) return FileThumbnailOutcome.Skipped;
    return FileThumbnailOutcome.Created;
  } catch (error) {
    // The file name is PII; log only the id and a stable error code.
    console.error("[files] thumbnail generation failed", {
      fileId,
      code: error instanceof StorageError ? error.code : RENDER_FAILED,
    });
    return FileThumbnailOutcome.Failed;
  }
}

/**
 * Rounding the expiry down to a window keeps the signed URL identical across list loads, so the
 * browser serves repeat views from its cache. The remaining lifetime stays between
 * TTL − window and TTL.
 */
function stableExpiry(): Date {
  const windowStart =
    Math.floor(Date.now() / SIGNED_URL_WINDOW_MS) * SIGNED_URL_WINDOW_MS;
  return new Date(windowStart + DOWNLOAD_URL_TTL_MS);
}

/**
 * Inline URLs keyed by file id, only for rows the caller already filtered for visibility. A row
 * whose URL cannot be signed is left out and shows its kind icon; the list itself never fails.
 */
async function signUrls(
  rows: readonly FileRow[],
  adapter?: StorageAdapter,
): Promise<Map<string, string>> {
  const expiresAt = stableExpiry();
  const urls = new Map<string, string>();
  const withPreview = rows.filter((row) => row.thumbnail_key);
  if (withPreview.length === 0) return urls;
  let signer: StorageAdapter;
  try {
    signer = adapter ?? storageService.getAdapter();
  } catch (error) {
    console.error("[files] thumbnail signing failed", {
      code: error instanceof StorageError ? error.code : RENDER_FAILED,
    });
    return urls;
  }
  let failure: string | null = null;
  await Promise.all(
    withPreview.map(async (row) => {
      if (!row.thumbnail_key) return;
      try {
        urls.set(
          row.id,
          await signer.createDownloadUrl(row.thumbnail_key, {
            expiresAt,
            disposition: StorageDisposition.Inline,
            filename: row.thumbnail_key.split("/").pop()!,
            cacheable: true,
          }),
        );
      } catch (error) {
        if (
          !(error instanceof StorageError) ||
          error.code !== StorageErrorCode.ProxyRequired
        )
          failure = error instanceof StorageError ? error.code : RENDER_FAILED;
      }
    }),
  );
  if (failure)
    console.error("[files] thumbnail signing failed", { code: failure });
  return urls;
}

async function signUrl(
  row: FileRow,
  adapter?: StorageAdapter,
): Promise<string | null> {
  return (await signUrls([row], adapter)).get(row.id) ?? null;
}

/** Runs after the response, so the uploader never waits for image processing. */
function schedule(fileId: string): void {
  after(() => generate(fileId));
}

export const fileThumbnailService = {
  create,
  generate,
  schedule,
  signUrl,
  signUrls,
};
