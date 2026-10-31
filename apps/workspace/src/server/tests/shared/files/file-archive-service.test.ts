import { afterEach, describe, expect, it, vi } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileArchiveEntryStatus } from "@/common/constants/files/file-archive-entry-status";
import { ARCHIVE_TIME_BUDGET_MS } from "@/common/constants/files/file-archive-limits";
import type { ArchiveEntryOutcome } from "@/server/shared/files/file-object-service-types";
import { storageService } from "@/server/shared/files/storage-service";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";
import { fileRequestSchemas } from "@/server/shared/files/file-request-schemas";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

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
  it("cancels a pending storage read on client disconnect without waiting for the deadline", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const cancelled = vi.fn();
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream: vi.fn(
        async () => new ReadableStream<Uint8Array>({ cancel: cancelled }),
      ),
    } as never);
    const abort = new AbortController();
    const stream = fileArchiveService.stream(
      [{ displayName: "slow.pdf", storageKey: "slow", url: null }],
      abort.signal,
    );
    const finished = new Response(stream).arrayBuffer().catch(() => undefined);

    await vi.advanceTimersByTimeAsync(0);
    abort.abort();
    await finished;
    await vi.advanceTimersByTimeAsync(0);

    expect(cancelled).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not open storage for an already aborted request", async () => {
    const openReadStream = vi.fn();
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    const abort = new AbortController();
    abort.abort();
    const stream = fileArchiveService.stream(
      [{ displayName: "slow.pdf", storageKey: "slow", url: null }],
      abort.signal,
    );

    await expect(new Response(stream).arrayBuffer()).rejects.toThrow();
    expect(openReadStream).not.toHaveBeenCalled();
  });

  it("stops an actively progressing file at the deadline and preserves the manifest and README", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const cancelled = vi.fn();
    const openReadStream = vi.fn(async () => {
      let timer: ReturnType<typeof setTimeout>;
      return new ReadableStream<Uint8Array>({
        start(controller) {
          const send = () => {
            controller.enqueue(new TextEncoder().encode("partial"));
            timer = setTimeout(send, 20_000);
          };
          timer = setTimeout(send, 20_000);
        },
        cancel() {
          clearTimeout(timer);
          cancelled();
        },
      });
    });
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    const build = vi.fn((outcomes: readonly ArchiveEntryOutcome[]) =>
      JSON.stringify({ answers: ["preserved"], outcomes }),
    );
    const stream = fileArchiveService.stream(
      [
        { displayName: "slow.pdf", storageKey: "slow", url: null },
        { displayName: "next.pdf", storageKey: "next", url: null },
      ],
      new AbortController().signal,
      {
        texts: [{ name: "README.md", content: "# Guide" }],
        manifest: { name: "onboarding.json", build },
      },
    );
    const body = new Response(stream).arrayBuffer();

    await vi.advanceTimersByTimeAsync(ARCHIVE_TIME_BUDGET_MS);
    const archive = unzipSync(new Uint8Array(await body));

    expect(strFromU8(archive["slow.pdf"]!)).toBe("partial".repeat(4));
    expect(archive["next.pdf"]).toBeUndefined();
    expect(strFromU8(archive["README.md"]!)).toBe("# Guide");
    expect(JSON.parse(strFromU8(archive["onboarding.json"]!))).toEqual({
      answers: ["preserved"],
      outcomes: [
        { path: "slow.pdf", status: FileArchiveEntryStatus.Timeout },
        { path: "next.pdf", status: FileArchiveEntryStatus.Timeout },
      ],
    });
    expect(openReadStream).toHaveBeenCalledTimes(1);
    expect(cancelled).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("finishes while storage is still opening and cancels a stream that arrives late", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const cancelled = vi.fn();
    const openReadStream = vi.fn(
      () =>
        new Promise<ReadableStream<Uint8Array>>((resolve) => {
          setTimeout(
            () => resolve(new ReadableStream({ cancel: cancelled })),
            ARCHIVE_TIME_BUDGET_MS + 1_000,
          );
        }),
    );
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    const stream = fileArchiveService.stream(
      [{ displayName: "slow.pdf", storageKey: "slow", url: null }],
      new AbortController().signal,
      {
        manifest: {
          name: "onboarding.json",
          build: (outcomes) => JSON.stringify(outcomes),
        },
      },
    );
    const body = new Response(stream).arrayBuffer();

    await vi.advanceTimersByTimeAsync(ARCHIVE_TIME_BUDGET_MS);
    const archive = unzipSync(new Uint8Array(await body));
    expect(Object.keys(archive)).toEqual(["onboarding.json"]);
    expect(JSON.parse(strFromU8(archive["onboarding.json"]!))).toEqual([
      { path: "slow.pdf", status: FileArchiveEntryStatus.Timeout },
    ]);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(cancelled).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses the remaining request budget instead of starting a fresh budget", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const openReadStream = vi.fn(
      () => new Promise<ReadableStream<Uint8Array>>(() => undefined),
    );
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    const build = vi.fn(() => "{}");
    const stream = fileArchiveService.stream(
      [{ displayName: "slow.pdf", storageKey: "slow", url: null }],
      new AbortController().signal,
      { deadlineAt: Date.now() + 1_000, manifest: { name: "m.json", build } },
    );
    const body = new Response(stream).arrayBuffer();
    await vi.advanceTimersByTimeAsync(999);
    expect(build).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(Object.keys(unzipSync(new Uint8Array(await body)))).toEqual([
      "m.json",
    ]);
    expect(build).toHaveBeenCalledWith([
      { path: "slow.pdf", status: FileArchiveEntryStatus.Timeout },
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("finishes a valid archive and lists files skipped after the time budget", async () => {
    const openReadStream = vi.fn();
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    let calls = 0;
    const stream = fileArchiveService.stream(
      [{ displayName: "late.pdf", storageKey: "late", url: null }],
      new AbortController().signal,
      { now: () => (calls++ === 0 ? 0 : 96_000) },
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

  it("places entries in folders and writes the manifest last with every outcome", async () => {
    const bytes = new TextEncoder().encode("file contents");
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream: vi.fn(async (key: string) => {
        if (key === "missing") throw new Error("private provider detail");
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        });
      }),
    } as never);
    const build = vi.fn(() => '{"ok":true}');
    const stream = fileArchiveService.stream(
      [
        {
          displayName: "logo.png",
          storageKey: "one",
          url: null,
          folder: "a/b",
        },
        {
          displayName: "logo.png",
          storageKey: "two",
          url: null,
          folder: "a/b",
        },
        {
          displayName: "logo.png",
          storageKey: "three",
          url: null,
          folder: "a/c",
        },
        {
          displayName: "gone.pdf",
          storageKey: "missing",
          url: null,
          folder: "a",
        },
      ],
      new AbortController().signal,
      { manifest: { name: "onboarding.json", build } },
    );

    const archive = unzipSync(
      new Uint8Array(await new Response(stream).arrayBuffer()),
    );
    expect(Object.keys(archive)).toEqual([
      "a/b/logo.png",
      "a/b/logo (2).png",
      "a/c/logo.png",
      "onboarding.json",
    ]);
    expect(strFromU8(archive["onboarding.json"])).toBe('{"ok":true}');
    expect(build).toHaveBeenCalledWith([
      { path: "a/b/logo.png", status: FileArchiveEntryStatus.Included },
      { path: "a/b/logo (2).png", status: FileArchiveEntryStatus.Included },
      { path: "a/c/logo.png", status: FileArchiveEntryStatus.Included },
      { path: "a/gone.pdf", status: FileArchiveEntryStatus.Unreadable },
    ]);
  });

  it("writes fixed texts next to the manifest and keeps entries from taking their names", async () => {
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream: vi.fn(
        async () =>
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode("x"));
              controller.close();
            },
          }),
      ),
    } as never);
    const stream = fileArchiveService.stream(
      [{ displayName: "readme.md", storageKey: "one", url: null }],
      new AbortController().signal,
      {
        manifest: { name: "m.json", build: () => "{}" },
        texts: [{ name: "README.md", content: "# Guide" }],
      },
    );
    const archive = unzipSync(
      new Uint8Array(await new Response(stream).arrayBuffer()),
    );

    expect(Object.keys(archive)).toEqual([
      "readme (2).md",
      "README.md",
      "m.json",
    ]);
    expect(strFromU8(archive["README.md"]!)).toBe("# Guide");
  });

  it("reports a timeout to the manifest instead of a missing-files note", async () => {
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream: vi.fn(),
    } as never);
    let calls = 0;
    const build = vi.fn(() => "{}");
    const stream = fileArchiveService.stream(
      [{ displayName: "late.pdf", storageKey: "late", url: null, folder: "x" }],
      new AbortController().signal,
      {
        now: () => (calls++ === 0 ? 0 : 96_000),
        manifest: { name: "m.json", build },
      },
    );
    const archive = unzipSync(
      new Uint8Array(await new Response(stream).arrayBuffer()),
    );
    expect(Object.keys(archive)).toEqual(["m.json"]);
    expect(build).toHaveBeenCalledWith([
      { path: "x/late.pdf", status: FileArchiveEntryStatus.Timeout },
    ]);
  });

  it("logs a failing manifest without its content and breaks the archive", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const stream = fileArchiveService.stream([], new AbortController().signal, {
      manifest: {
        name: "m.json",
        build: () => {
          throw new Error("answer: secret text");
        },
      },
    });

    await expect(stream.getReader().read()).rejects.toThrow(
      "File archive stream failed",
    );
    expect(log).toHaveBeenCalledWith("[files] archive stream failed", {
      manifest: true,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret text");
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
