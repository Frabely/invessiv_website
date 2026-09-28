import { afterEach, describe, expect, it, vi } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { storageService } from "@/server/shared/files/storage-service";
import { fileArchiveStream } from "@/server/workspace/crm/services/files/file-archive-stream";

vi.mock("server-only", () => ({}));

afterEach(() => vi.restoreAllMocks());

describe("file archive stream", () => {
  it("finishes a valid archive and lists files skipped after the time budget", async () => {
    const openReadStream = vi.fn();
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    let calls = 0;
    const stream = fileArchiveStream(
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
    const stream = fileArchiveStream(
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
    fileArchiveStream(
      [{ displayName: "big.bin", storageKey: "big", url: null }],
      abort.signal,
    );

    await vi.waitFor(() => expect(openReadStream).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    abort.abort();

    await vi.waitFor(() => expect(cancelled).toHaveBeenCalled());
  });
});
