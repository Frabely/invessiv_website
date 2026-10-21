import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { StorageError } from "@invessiv/storage";
import { createInMemoryStorage } from "@invessiv/storage/testing";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { fileThumbnailService } from "@/server/shared/files/file-thumbnail-service";

vi.mock("server-only", () => ({}));

function row(extension: UploadExtension, overrides: Partial<FileRow> = {}) {
  const value: FileRow = {
    id: crypto.randomUUID(),
    customer_id: crypto.randomUUID(),
    project_id: null,
    feedback_round_id: null,
    feedback_item_id: null,
    source: FileSource.Upload,
    status: FileStatus.Ready,
    asset_kind: AssetKind.Image,
    display_name: `photo.${extension}`,
    note: null,
    visible_to_customer: true,
    uploaded_by_side: UploadSide.Customer,
    uploaded_by_member_id: null,
    uploaded_by_portal_membership_id: crypto.randomUUID(),
    storage_key: `customers/c/f/photo.${extension}`,
    thumbnail_key: null,
    content_type: "image/" + extension,
    extension,
    size_bytes: 1,
    inspection_status: FileInspectionStatus.Unscanned,
    url: null,
    orphaned_at: null,
    version: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };
  return { ...value, ...overrides };
}

async function photo(format: "jpeg" | "png", width: number, height: number) {
  return new Uint8Array(
    await sharp({
      create: { width, height, channels: 3, background: "#3366cc" },
    })
      .withExif({ IFD0: { Make: "PrivacyPhone" } })
      .withMetadata({ orientation: 6 })
      [format]()
      .toBuffer(),
  );
}

describe("fileThumbnailService.signUrls", () => {
  afterEach(() => vi.useRealTimers());

  it("signs inline, cacheable URLs only for rows with a preview", async () => {
    const storage = createInMemoryStorage();
    const sign = vi.spyOn(storage.adapter, "createDownloadUrl");
    const withPreview = row(UploadExtension.Png, {
      thumbnail_key: "customers/c/f/photo.png.thumb.webp",
    });

    const urls = await fileThumbnailService.signUrls(storage.adapter, [
      withPreview,
      row(UploadExtension.Png),
    ]);

    expect(urls.get(withPreview.id)).toContain("https://");
    expect(urls.size).toBe(1);
    expect(sign).toHaveBeenCalledWith(withPreview.thumbnail_key, {
      disposition: StorageDisposition.Inline,
      filename: "photo.png.thumb.webp",
      expiresAt: expect.any(Date),
      cacheable: true,
    });
  });

  it("keeps the URL stable within a two-minute window so browsers reuse it", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-20T10:00:10Z") });
    const storage = createInMemoryStorage();
    const file = row(UploadExtension.Png, {
      thumbnail_key: "k/photo.thumb.webp",
    });

    const first = await fileThumbnailService.signUrls(storage.adapter, [file]);
    vi.setSystemTime(new Date("2026-10-20T10:01:50Z"));
    const second = await fileThumbnailService.signUrls(storage.adapter, [file]);
    vi.setSystemTime(new Date("2026-10-20T10:02:00Z"));
    const third = await fileThumbnailService.signUrls(storage.adapter, [file]);

    expect(second.get(file.id)).toBe(first.get(file.id));
    expect(third.get(file.id)).not.toBe(first.get(file.id));
    const expires = Number(
      new URL(first.get(file.id)!).searchParams.get("expires"),
    );
    // At least three minutes left, never beyond the five-minute download TTL.
    expect(expires).toBe(new Date("2026-10-20T10:05:00Z").getTime());
  });

  it("leaves a row out when its store requires a proxy or fails", async () => {
    const storage = createInMemoryStorage();
    vi.spyOn(storage.adapter, "createDownloadUrl")
      .mockRejectedValueOnce(new StorageError(StorageErrorCode.ProxyRequired))
      .mockRejectedValueOnce(new StorageError(StorageErrorCode.Unavailable));
    const files = [
      row(UploadExtension.Png, { thumbnail_key: "a.thumb.webp" }),
      row(UploadExtension.Png, { thumbnail_key: "b.thumb.webp" }),
    ];

    expect(
      (await fileThumbnailService.signUrls(storage.adapter, files)).size,
    ).toBe(0);
  });
});

describe("fileThumbnailService.create", () => {
  it("stores a small WebP without EXIF data next to the original", async () => {
    const storage = createInMemoryStorage();
    const file = row(UploadExtension.Jpg);
    storage.seed(
      file.storage_key!,
      await photo("jpeg", 1200, 600),
      "image/jpeg",
    );

    const key = await fileThumbnailService.create(storage.adapter, file);

    expect(key).toBe(`${file.storage_key}.thumb.webp`);
    expect(await storage.adapter.head(key!)).toMatchObject({
      contentType: "image/webp",
    });
    const bytes = await new Response(
      await storage.adapter.openReadStream(key!),
    ).arrayBuffer();
    const metadata = await sharp(Buffer.from(bytes)).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    // Orientation 6 rotates the landscape original into portrait before resizing.
    expect({ width: metadata.width, height: metadata.height }).toEqual({
      width: 80,
      height: 160,
    });
    expect(bytes.byteLength).toBeLessThan(10_000);
  });

  it("never enlarges a small PNG", async () => {
    const storage = createInMemoryStorage();
    const file = row(UploadExtension.Png);
    storage.seed(file.storage_key!, await photo("png", 40, 20), "image/png");

    const key = await fileThumbnailService.create(storage.adapter, file);

    const bytes = await new Response(
      await storage.adapter.openReadStream(key!),
    ).arrayBuffer();
    const metadata = await sharp(Buffer.from(bytes)).metadata();
    expect([metadata.width, metadata.height].sort()).toEqual([20, 40]);
  });

  it.each([
    ["HEIC", row(UploadExtension.Heic)],
    ["SVG", row(UploadExtension.Svg)],
    [
      "a document",
      row(UploadExtension.Pdf, { asset_kind: AssetKind.Document }),
    ],
    [
      "a pending upload",
      row(UploadExtension.Png, { status: FileStatus.Pending }),
    ],
    [
      "an orphaned upload",
      row(UploadExtension.Png, { orphaned_at: new Date() }),
    ],
    [
      "a file that already has a preview",
      row(UploadExtension.Png, { thumbnail_key: "existing.thumb.webp" }),
    ],
  ])("skips %s without touching storage", async (_label, file) => {
    const storage = createInMemoryStorage();
    const openReadStream = vi.spyOn(storage.adapter, "openReadStream");

    expect(await fileThumbnailService.create(storage.adapter, file)).toBeNull();
    expect(openReadStream).not.toHaveBeenCalled();
  });

  it("propagates a failed write and leaves no preview behind", async () => {
    const storage = createInMemoryStorage();
    const file = row(UploadExtension.Png);
    storage.seed(file.storage_key!, await photo("png", 400, 400), "image/png");
    vi.spyOn(storage.adapter, "put").mockRejectedValueOnce(
      new StorageError(StorageErrorCode.Unavailable),
    );

    await expect(
      fileThumbnailService.create(storage.adapter, file),
    ).rejects.toMatchObject({ code: StorageErrorCode.Unavailable });
    expect(
      await storage.adapter.head(`${file.storage_key}.thumb.webp`),
    ).toBeNull();
  });

  it("rejects bytes that are not a decodable image", async () => {
    const storage = createInMemoryStorage();
    const file = row(UploadExtension.Png);
    storage.seed(
      file.storage_key!,
      new TextEncoder().encode("nope"),
      "image/png",
    );

    await expect(
      fileThumbnailService.create(storage.adapter, file),
    ).rejects.toThrow();
    expect(
      await storage.adapter.head(`${file.storage_key}.thumb.webp`),
    ).toBeNull();
  });
});
