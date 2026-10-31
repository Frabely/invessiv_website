import "server-only";
import { once } from "node:events";
import { PassThrough, Readable } from "node:stream";
import { strToU8, Zip, ZipPassThrough } from "fflate";
import { z } from "zod";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileOperationErrorCode } from "@invessiv/common/contracts/files/file-operation-error-code";
import { sanitizeFilename } from "@invessiv/common/patterns/files/safe-filename";
import { files } from "@invessiv/db/record-configuration";
import {
  ARCHIVE_TIME_BUDGET_MS,
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
} from "@/common/constants/files/file-archive-limits";
import { FileArchiveEntryStatus } from "@/common/constants/files/file-archive-entry-status";
import { storageService } from "@/server/shared/files/storage-service";
import type {
  ArchiveEntry,
  ArchiveEntryOutcome,
  ArchiveRow,
  ArchiveStreamOptions,
} from "./file-object-service-types";

const UUID = z.uuid();

/** The select list behind `ArchiveRow`; callers add their own filter columns. */
const columns = {
  id: files.id,
  assetKind: files.asset_kind,
  displayName: files.display_name,
  storageKey: files.storage_key,
  sizeBytes: files.size_bytes,
  url: files.url,
};

/** The folder is built by the caller from trusted keys; only the leaf comes from user input. */
function uniqueName(name: string, used: Set<string>, folder?: string): string {
  const safe = sanitizeFilename(name);
  const dot = safe.lastIndexOf(".");
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : "";
  const place = (leaf: string) => (folder ? `${folder}/${leaf}` : leaf);
  let candidate = place(safe);
  let suffix = 2;
  while (used.has(candidate.toLocaleLowerCase())) {
    candidate = place(`${stem} (${suffix++})${ext}`);
  }
  used.add(candidate.toLocaleLowerCase());
  return candidate;
}

/** ZIP bytes are produced only as the response consumes them; entries are read one at a time. */
function stream(
  entries: readonly ArchiveEntry[],
  signal: AbortSignal,
  {
    now = Date.now,
    deadlineAt = now() + ARCHIVE_TIME_BUDGET_MS,
    manifest,
    texts = [],
  }: ArchiveStreamOptions = {},
) {
  const output = new PassThrough({ highWaterMark: 64 * 1024 });
  const fileStop = new AbortController();
  let timedOut = false;
  const deadlineTimer = setTimeout(
    () => {
      timedOut = true;
      fileStop.abort();
    },
    Math.max(0, deadlineAt - now()),
  );
  deadlineTimer.unref();
  const stopFiles = () => fileStop.abort();
  output.once("close", stopFiles);

  function checkDeadline() {
    if (now() >= deadlineAt) {
      timedOut = true;
      fileStop.abort();
    }
  }

  /** A provider may keep sending chunks forever; only this fixed deadline bounds its reads. */
  async function readBeforeDeadline<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    checkDeadline();
    if (fileStop.signal.aborted)
      return Promise.reject(new Error("Archive file reading stopped"));
    let onStop: () => void = () => undefined;
    const interrupted = new Promise<never>((_, reject) => {
      onStop = () => reject(new Error("Archive file reading stopped"));
      fileStop.signal.addEventListener("abort", onStop, { once: true });
    });
    try {
      const result = await Promise.race([operation(), interrupted]);
      checkDeadline();
      return fileStop.signal.aborted
        ? Promise.reject(new Error("Archive file reading stopped"))
        : result;
    } finally {
      fileStop.signal.removeEventListener("abort", onStop);
    }
  }
  const zip = new Zip((error, chunk, final) => {
    if (error) output.destroy(error);
    else if (final) output.end(chunk);
    else output.write(chunk);
  });
  const abortOutput = () => {
    fileStop.abort();
    output.destroy();
  };
  signal.addEventListener("abort", abortOutput, { once: true });

  async function push(
    entry: ZipPassThrough,
    chunk: Uint8Array,
    final: boolean,
  ) {
    entry.push(chunk, final);
    if (!output.writableNeedDrain || output.destroyed) return;
    // destroy() without an error emits only "close", so waiting on "drain" alone would hang on abort.
    const wait = new AbortController();
    try {
      await Promise.race([
        once(output, "drain", { signal: wait.signal }),
        once(output, "close", { signal: wait.signal }),
      ]);
    } finally {
      wait.abort();
    }
  }

  // Attach the web stream before producing: a failure before the first await would otherwise
  // destroy `output` with no error listener and crash the process.
  const web = Readable.toWeb(output) as ReadableStream<Uint8Array>;
  if (signal.aborted) abortOutput();

  void (async () => {
    const used = new Set(
      [
        ...texts.map((text) => text.name),
        ...(manifest
          ? [manifest.name]
          : ["_links.txt", "_fehlende-dateien.txt"]),
      ].map((name) => name.toLocaleLowerCase()),
    );
    const links: string[] = [];
    const missing: string[] = [];
    const outcomes: ArchiveEntryOutcome[] = [];
    try {
      for (const item of entries) {
        if (output.destroyed) break;
        const name = uniqueName(item.displayName, used, item.folder);
        if (!item.storageKey) {
          if (item.url) links.push(`${name}\n${item.url}`);
          outcomes.push({ path: name, status: FileArchiveEntryStatus.Link });
          continue;
        }
        checkDeadline();
        if (timedOut) {
          missing.push(name);
          outcomes.push({ path: name, status: FileArchiveEntryStatus.Timeout });
          continue;
        }
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        let part: ZipPassThrough | undefined;
        try {
          const storageKey = item.storageKey;
          const activeReader = await readBeforeDeadline(async () => {
            const source = await storageService
              .getAdapter()
              .openReadStream(storageKey);
            // Opening may settle after the archive has already finished. Never leak that body.
            if (fileStop.signal.aborted) {
              void source.cancel().catch(() => undefined);
              return Promise.reject(new Error("Archive file reading stopped"));
            }
            reader = source.getReader();
            return reader;
          });
          part = new ZipPassThrough(name);
          zip.add(part);
          while (!output.destroyed) {
            const next = await readBeforeDeadline(() => activeReader.read());
            if (next.done) break;
            await push(part, next.value, false);
          }
          await push(part, new Uint8Array(), true);
          outcomes.push({
            path: name,
            status: FileArchiveEntryStatus.Included,
          });
        } catch {
          checkDeadline();
          missing.push(name);
          outcomes.push({
            path: name,
            status: timedOut
              ? FileArchiveEntryStatus.Timeout
              : FileArchiveEntryStatus.Unreadable,
          });
          if (part && !output.destroyed)
            await push(part, new Uint8Array(), true);
        } finally {
          if (reader) void reader.cancel().catch(() => undefined);
        }
      }
      const notes: [string, string][] = texts.map((text) => [
        text.name,
        text.content,
      ]);
      if (manifest) notes.push([manifest.name, manifest.build(outcomes)]);
      else {
        if (links.length) notes.push(["_LINKS.txt", links.join("\n\n")]);
        if (missing.length)
          notes.push(["_FEHLENDE-DATEIEN.txt", missing.join("\n")]);
      }
      for (const [name, text] of notes) {
        if (output.destroyed) break;
        const part = new ZipPassThrough(name);
        zip.add(part);
        await push(part, strToU8(text), true);
      }
      if (!output.destroyed) zip.end();
    } catch {
      // The response has started, so this log is the only trace of a broken archive. No details:
      // a manifest error may carry customer answers, a provider error a signed URL.
      console.error("[files] archive stream failed", {
        manifest: Boolean(manifest),
      });
      output.destroy(new Error("File archive stream failed"));
    } finally {
      clearTimeout(deadlineTimer);
      fileStop.abort();
      output.removeListener("close", stopFiles);
      signal.removeEventListener("abort", abortOutput);
    }
  })();

  return web;
}

/** Shape checks before any query: ids, duplicates and count. */
function checkSelection(
  customerId: string,
  fileIds: readonly string[],
): FileOperationErrorCode | null {
  if (
    !UUID.safeParse(customerId).success ||
    fileIds.length < 1 ||
    new Set(fileIds.map((id) => id.toLowerCase())).size !== fileIds.length ||
    !fileIds.every((id) => UUID.safeParse(id).success)
  )
    return FileApiErrorCode.Validation;
  return fileIds.length > MAX_ARCHIVE_FILES
    ? FileApiErrorCode.ArchiveLimit
    : null;
}

/**
 * Runs before the first ZIP byte on rows the caller already narrowed to readable entries of one
 * customer. Any id missing from `rows` was foreign or hidden and fails the whole archive.
 */
function plan(
  fileIds: readonly string[],
  rows: readonly ArchiveRow[],
):
  | { ok: true; rows: ArchiveRow[] }
  | { ok: false; code: FileOperationErrorCode } {
  if (rows.length !== fileIds.length)
    return { ok: false, code: FileApiErrorCode.NotFound };
  let totalBytes = 0;
  for (const row of rows) {
    if (row.assetKind === AssetKind.Video)
      return { ok: false, code: FileApiErrorCode.ArchiveVideo };
    if (row.storageKey) {
      if (!row.sizeBytes || row.sizeBytes <= 0)
        return { ok: false, code: FileApiErrorCode.Validation };
      totalBytes += row.sizeBytes;
    } else if (!row.url) {
      return { ok: false, code: FileApiErrorCode.Validation };
    }
  }
  if (totalBytes > MAX_ARCHIVE_BYTES)
    return { ok: false, code: FileApiErrorCode.ArchiveLimit };
  // Postgres matches ids case-insensitively, so the lookup must too.
  const byId = new Map(rows.map((row) => [row.id.toLowerCase(), row]));
  const ordered = fileIds.map((id) => byId.get(id.toLowerCase()));
  if (ordered.some((row) => !row))
    return { ok: false, code: FileApiErrorCode.NotFound };
  return { ok: true, rows: ordered as ArchiveRow[] };
}

export const fileArchiveService = { columns, checkSelection, plan, stream };
