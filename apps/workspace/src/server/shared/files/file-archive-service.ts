import "server-only";
import { once } from "node:events";
import { PassThrough, Readable } from "node:stream";
import { strToU8, Zip, ZipPassThrough } from "fflate";
import { z } from "zod";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileOperationErrorCode } from "@invessiv/common/contracts/files/file-operation-error-code";
import { sanitizeFilename } from "@invessiv/common/patterns/files/safe-filename";
import {
  ARCHIVE_TIME_BUDGET_MS,
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
} from "@/common/constants/files/file-archive-limits";
import { storageService } from "@/server/shared/files/storage-service";
import type { ArchiveRow } from "./file-object-service-types";

type ArchiveEntry = Pick<ArchiveRow, "displayName" | "storageKey" | "url">;

const UUID = z.uuid();

function uniqueName(name: string, used: Set<string>): string {
  const safe = sanitizeFilename(name);
  const dot = safe.lastIndexOf(".");
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : "";
  let candidate = safe;
  let suffix = 2;
  while (used.has(candidate.toLocaleLowerCase())) {
    candidate = `${stem} (${suffix++})${ext}`;
  }
  used.add(candidate.toLocaleLowerCase());
  return candidate;
}

/** ZIP bytes are produced only as the response consumes them; entries are read one at a time. */
function stream(
  entries: readonly ArchiveEntry[],
  signal: AbortSignal,
  now: () => number = Date.now,
) {
  const startedAt = now();
  const output = new PassThrough({ highWaterMark: 64 * 1024 });
  const zip = new Zip((error, chunk, final) => {
    if (error) output.destroy(error);
    else if (final) output.end(chunk);
    else output.write(chunk);
  });
  signal.addEventListener("abort", () => output.destroy(), { once: true });

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

  void (async () => {
    const used = new Set(["_links.txt", "_fehlende-dateien.txt"]);
    const links: string[] = [];
    const missing: string[] = [];
    try {
      for (const item of entries) {
        if (output.destroyed) break;
        const name = uniqueName(item.displayName, used);
        if (!item.storageKey) {
          if (item.url) links.push(`${name}\n${item.url}`);
          continue;
        }
        if (now() - startedAt >= ARCHIVE_TIME_BUDGET_MS) {
          missing.push(name);
          continue;
        }
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        let part: ZipPassThrough | undefined;
        try {
          const stream = await storageService
            .getAdapter()
            .openReadStream(item.storageKey);
          reader = stream.getReader();
          part = new ZipPassThrough(name);
          zip.add(part);
          while (!output.destroyed) {
            const next = await reader.read();
            if (next.done) break;
            await push(part, next.value, false);
          }
          await push(part, new Uint8Array(), true);
        } catch {
          missing.push(name);
          if (part && !output.destroyed)
            await push(part, new Uint8Array(), true);
        } finally {
          if (reader) void reader.cancel().catch(() => undefined);
        }
      }
      if (!output.destroyed && links.length) {
        const part = new ZipPassThrough("_LINKS.txt");
        zip.add(part);
        await push(part, strToU8(links.join("\n\n")), true);
      }
      if (!output.destroyed && missing.length) {
        const part = new ZipPassThrough("_FEHLENDE-DATEIEN.txt");
        zip.add(part);
        await push(part, strToU8(missing.join("\n")), true);
      }
      if (!output.destroyed) zip.end();
    } catch {
      output.destroy(new Error("File archive stream failed"));
    }
  })();

  return Readable.toWeb(output) as ReadableStream<Uint8Array>;
}

/** Shape checks before any query: ids, duplicates and count. */
function checkSelection(
  customerId: string,
  fileIds: readonly string[],
): FileOperationErrorCode | null {
  if (
    !UUID.safeParse(customerId).success ||
    fileIds.length < 1 ||
    new Set(fileIds).size !== fileIds.length ||
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
  const byId = new Map(rows.map((row) => [row.id, row]));
  return { ok: true, rows: fileIds.map((id) => byId.get(id)!) };
}

export const fileArchiveService = { checkSelection, plan, stream };
