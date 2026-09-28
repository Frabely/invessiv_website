import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { CreateFileLinkRequestDto } from "@invessiv/common/contracts/files/create-file-link-request.dto";
import type { CreateFileUploadRequestDto } from "@invessiv/common/contracts/files/create-file-upload-request.dto";
import type { FileListPageDto } from "@invessiv/common/contracts/files/file-list-page.dto";
import type { FileListQueryDto } from "@invessiv/common/contracts/files/file-list-query.dto";
import type { FileUploadTicketResponseDto } from "@invessiv/common/contracts/files/file-upload-ticket-response.dto";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { UpdateFileRequestDto } from "@invessiv/common/contracts/files/update-file-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { FileDeleteClientResult } from "@/common/contracts/files/file-delete-client-result";
import type { FileMutationClientResult } from "@/common/contracts/files/file-mutation-client-result";
import {
  crmCustomerFileLinksEndpoint,
  crmCustomerFilesEndpoint,
  crmCustomerFileUploadsEndpoint,
  crmFileCompleteEndpoint,
  crmFileDownloadEndpoint,
  crmFileDownloadUrlEndpoint,
  crmFileEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord, readVersionConflict, send } = versionedJsonMutationService;
type JsonResponse = NonNullable<Awaited<ReturnType<typeof send>>>;
const KNOWN_CODES: readonly FileClientErrorCode[] = [
  ...Object.values(FileApiErrorCode),
  ...Object.values(FileErrorCode),
];

function isFile(value: unknown): value is FileDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
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

function readWriteFailure(response: JsonResponse) {
  const current = readVersionConflict(response, isFile);
  return current
    ? ({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current,
      } as const)
    : ({ ok: false, code: readCode(response.payload) } as const);
}

function listFiles(
  customerId: string,
  query: FileListQueryDto,
): Promise<FileClientResult<FileListPageDto>> {
  const params = new URLSearchParams();
  if (query.page) params.set(FileQueryParam.Page, String(query.page));
  if (query.pageSize)
    params.set(FileQueryParam.PageSize, String(query.pageSize));
  if (query.projectId !== undefined)
    params.set(FileQueryParam.ProjectId, query.projectId ?? "null");
  if (query.assetKind) params.set(FileQueryParam.AssetKind, query.assetKind);
  if (query.origin) params.set(FileQueryParam.Origin, query.origin);
  if (query.search) params.set(FileQueryParam.Search, query.search);
  const search = params.toString();
  return request(
    search
      ? `${crmCustomerFilesEndpoint(customerId)}?${search}`
      : crmCustomerFilesEndpoint(customerId),
    HttpMethod.Get,
    undefined,
    (payload) =>
      isRecord(payload) &&
      Array.isArray(payload.files) &&
      payload.files.every(isFile) &&
      typeof payload.total === "number"
        ? (payload as unknown as FileListPageDto)
        : null,
  );
}

function createUpload(
  customerId: string,
  input: CreateFileUploadRequestDto,
): Promise<FileClientResult<FileUploadTicketResponseDto>> {
  return request(
    crmCustomerFileUploadsEndpoint(customerId),
    HttpMethod.Post,
    input,
    (payload) =>
      isRecord(payload) &&
      isFile(payload.file) &&
      isRecord(payload.ticket) &&
      typeof payload.ticket.url === "string"
        ? (payload as unknown as FileUploadTicketResponseDto)
        : null,
  );
}

function completeUpload(fileId: string): Promise<FileClientResult<FileDto>> {
  return request(
    crmFileCompleteEndpoint(fileId),
    HttpMethod.Post,
    undefined,
    (payload) => (isFile(payload) ? payload : null),
  );
}

function createLink(
  customerId: string,
  input: CreateFileLinkRequestDto,
): Promise<FileClientResult<FileDto>> {
  return request(
    crmCustomerFileLinksEndpoint(customerId),
    HttpMethod.Post,
    input,
    (payload) => (isFile(payload) ? payload : null),
  );
}

async function updateFile(
  fileId: string,
  input: UpdateFileRequestDto,
): Promise<FileMutationClientResult> {
  const response = await send(crmFileEndpoint(fileId), HttpMethod.Patch, input);
  if (!response) return { ok: false, code: FileApiErrorCode.Internal };
  return response.ok && isFile(response.payload)
    ? { ok: true, file: response.payload }
    : readWriteFailure(response);
}

async function deleteFile(
  fileId: string,
  version: number,
): Promise<FileDeleteClientResult> {
  const response = await send(crmFileEndpoint(fileId), HttpMethod.Delete, {
    version,
  });
  if (!response) return { ok: false, code: FileApiErrorCode.Internal };
  return response.ok ? { ok: true } : readWriteFailure(response);
}

/** Same-origin and authenticated, so text previews never depend on storage CORS. */
async function readText(fileId: string): Promise<FileClientResult<string>> {
  try {
    const response = await fetch(crmFileDownloadEndpoint(fileId));
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
  fileId: string,
  disposition: StorageDisposition,
): Promise<FileClientResult<string>> {
  const params = new URLSearchParams({
    [FileQueryParam.Disposition]: disposition,
  });
  return request(
    `${crmFileDownloadUrlEndpoint(fileId)}?${params.toString()}`,
    HttpMethod.Get,
    undefined,
    (payload) =>
      isRecord(payload) && typeof payload.url === "string" ? payload.url : null,
  );
}

export const filesApiService = {
  listFiles,
  createUpload,
  completeUpload,
  createLink,
  updateFile,
  deleteFile,
  getDownloadUrl,
  readText,
} as const;
