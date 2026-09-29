import { afterEach, describe, expect, it, vi } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { storageService } from "@/server/shared/files/storage-service";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";
import { fileRequestSchemas } from "@/server/shared/files/file-request-schemas";

vi.mock("server-only", () => ({}));

afterEach(() => vi.restoreAllMocks());

describe("file archive selection", () => {
  const id = "0f8b4b7e-3c1d-4a5e-9b2f-6d7c8e9fa0b1";
  const row = {
    id,
    assetKind: AssetKind.Document,
    displayName: "offer.pdf",
    storageKey: "key",
    sizeBytes: 10,
    url: null,
  };

  it("plans upper-case ids against the lower-case rows Postgres returns", () => {
    expect(fileArchiveService.plan([id.toUpperCase()], [row])).toEqual({
      ok: true,
      rows: [row],
    });
  });

  it("rejects the same id in two spellings", () => {
    expect(
      fileArchiveService.checkSelection(crypto.randomUUID(), [
        id,
        id.toUpperCase(),
      ]),
    ).toBe(FileApiErrorCode.Validation);
  });

  it("normalizes archive ids to lower case at the request boundary", () => {
    expect(
      fileRequestSchemas.archive.parse({ fileIds: [id.toUpperCase()] }),
    ).toEqual({ fileIds: [id] });
  });
});

describe("file archive stream", () => {
  it("finishes a valid archive and lists files skipped after the time budget", async () => {
    const openReadStream = vi.fn();
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    let calls = 0;
    const stream = fileArchiveService.stream(
      [{ displayName: "late.pdf", storageKey: "late", url: null }],
      new AbortController().signal,
      () => (calls++ === 0 ? 0 : 96_000),
    );
    const archive = unzipSync(
      new Uint8Array(await new Response(stream).arrayBuffer()),
    );
    expect(strFromU8(archive["_FEHLENDE-DATEIEN.txt"])).toBe("late.pdf");
    expect(openReadStream).not.toHaveBeenCalled();
  });

  it("streams duplicate names with suffixes, lists links and reports unreadable files", async () => {
    const bytes = new TextEncoder().encode("file contents");
    const openReadStream = vi.fn(async (key: string) => {
      if (key === "missing") throw new Error("private provider detail");
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
    });
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    const stream = fileArchiveService.stream(
      [
        { displayName: "logo.png", storageKey: "one", url: null },
        { displayName: "logo.png", storageKey: "two", url: null },
        { displayName: "missing.pdf", storageKey: "missing", url: null },
        {
          displayName: "Brand guide",
          storageKey: null,
          url: "https://example.com/guide",
        },
      ],
      new AbortController().signal,
    );

    const archive = unzipSync(
      new Uint8Array(await new Response(stream).arrayBuffer()),
    );
    expect(strFromU8(archive["logo.png"])).toBe("file contents");
    expect(strFromU8(archive["logo (2).png"])).toBe("file contents");
    expect(strFromU8(archive["_LINKS.txt"])).toContain(
      "https://example.com/guide",
    );
    expect(strFromU8(archive["_FEHLENDE-DATEIEN.txt"])).toContain(
      "missing.pdf",
    );
    expect(JSON.stringify(Object.keys(archive))).not.toContain(
      "private provider detail",
    );
    expect(openReadStream).toHaveBeenCalledTimes(3);
  });

  it("releases the storage stream when the client aborts while the producer waits for drain", async () => {
    const cancelled = vi.fn();
    const openReadStream = vi.fn(
      async () =>
        new ReadableStream<Uint8Array>({
          pull(controller) {
            controller.enqueue(new Uint8Array(256 * 1024));
          },
          cancel: cancelled,
        }),
    );
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    const abort = new AbortController();
    fileArchiveService.stream(
      [{ displayName: "big.bin", storageKey: "big", url: null }],
      abort.signal,
    );

    await vi.waitFor(() => expect(openReadStream).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    abort.abort();

    await vi.waitFor(() => expect(cancelled).toHaveBeenCalled());
  });
});
