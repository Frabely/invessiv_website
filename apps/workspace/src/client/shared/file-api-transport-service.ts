import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { StorageUploadTicket } from "@invessiv/common/contracts/storage/storage-upload-ticket";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { PagedFiles } from "@/common/contracts/files/paged-files";

const { isRecord, send } = versionedJsonMutationService;
const KNOWN_CODES: readonly FileClientErrorCode[] = [
  ...Object.values(FileApiErrorCode),
  ...Object.values(FileErrorCode),
];

/** Shape guard shared by the CRM and the portal file DTO. */
function isFileEntry(
  value: unknown,
): value is { id: string; displayName: string } {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string"
  );
}

function readCode(payload: unknown): FileClientErrorCode {
  const code = isRecord(payload) ? payload.code : undefined;
  return (
    KNOWN_CODES.find((known) => known === code) ?? FileApiErrorCode.Internal
  );
}

async function request<T>(
  url: string,
  method: HttpMethod,
  body: unknown,
  read: (payload: unknown) => T | null,
): Promise<FileClientResult<T>> {
  const response = await send(url, method, body);
  if (!response) return { ok: false, code: FileApiErrorCode.Internal };
  const value = response.ok ? read(response.payload) : null;
  return value === null
    ? { ok: false, code: readCode(response.payload) }
    : { ok: true, value };
}

function readOne<TFile>(
  isFile: (value: unknown) => value is TFile,
): (payload: unknown) => TFile | null {
  return (payload) => (isFile(payload) ? payload : null);
}

function readPage<TFile>(
  payload: unknown,
  isFile: (value: unknown) => value is TFile,
): PagedFiles<TFile> | null {
  return isRecord(payload) &&
    Array.isArray(payload.files) &&
    payload.files.every(isFile) &&
    typeof payload.total === "number" &&
    typeof payload.page === "number" &&
    typeof payload.pageSize === "number"
    ? {
        files: payload.files,
        total: payload.total,
        page: payload.page,
        pageSize: payload.pageSize,
      }
    : null;
}

function readTicket<TFile>(
  payload: unknown,
  isFile: (value: unknown) => value is TFile,
): { file: TFile; ticket: StorageUploadTicket } | null {
  return isRecord(payload) &&
    isFile(payload.file) &&
    isRecord(payload.ticket) &&
    typeof payload.ticket.url === "string"
    ? (payload as { file: TFile; ticket: StorageUploadTicket })
    : null;
}

function readCancelled(payload: unknown): { cancelled: true } | null {
  return isRecord(payload) && payload.cancelled === true
    ? { cancelled: true }
    : null;
}

/** Same-origin and authenticated, so text previews never depend on storage CORS. */
async function readText(url: string): Promise<FileClientResult<string>> {
  try {
    const response = await fetch(url);
    return response.ok
      ? { ok: true, value: await response.text() }
      : {
          ok: false,
          code: readCode(await response.json().catch(() => null)),
        };
  } catch {
    return { ok: false, code: FileApiErrorCode.Internal };
  }
}

function getDownloadUrl(
  url: string,
  disposition: StorageDisposition,
): Promise<FileClientResult<string>> {
  const params = new URLSearchParams({
    [FileQueryParam.Disposition]: disposition,
  });
  return request(
    `${url}?${params.toString()}`,
    HttpMethod.Get,
    undefined,
    (payload) =>
      isRecord(payload) && typeof payload.url === "string" ? payload.url : null,
  );
}

async function downloadArchive(
  url: string,
  fileIds: readonly string[],
): Promise<FileClientResult<Blob>> {
  try {
    const response = await fetch(url, {
      method: HttpMethod.Post,
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
      body: JSON.stringify({ fileIds }),
    });
    if (!response.ok)
      return {
        ok: false,
        code: readCode(await response.json().catch(() => null)),
      };
    return { ok: true, value: await response.blob() };
  } catch {
    return { ok: false, code: FileApiErrorCode.Internal };
  }
}

export const fileApiTransportService = {
  isFileEntry,
  readCode,
  request,
  readOne,
  readPage,
  readTicket,
  readCancelled,
  readText,
  getDownloadUrl,
  downloadArchive,
} as const;
