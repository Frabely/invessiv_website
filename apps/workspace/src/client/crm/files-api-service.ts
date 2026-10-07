import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { CreateFileLinkRequestDto } from "@invessiv/common/contracts/files/create-file-link-request.dto";
import type { CreateFileUploadRequestDto } from "@invessiv/common/contracts/files/create-file-upload-request.dto";
import type { FileListPageDto } from "@invessiv/common/contracts/files/file-list-page.dto";
import type { FileListQueryDto } from "@invessiv/common/contracts/files/file-list-query.dto";
import type { FileUploadTicketResponseDto } from "@invessiv/common/contracts/files/file-upload-ticket-response.dto";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { UpdateFileRequestDto } from "@invessiv/common/contracts/files/update-file-request.dto";
import { fileApiTransportService as transport } from "@/client/shared/file-api-transport-service";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { FileDeleteClientResult } from "@/common/contracts/files/file-delete-client-result";
import type { FileMutationClientResult } from "@/common/contracts/files/file-mutation-client-result";
import type { UploadQueueTransport } from "@/common/contracts/files/upload-queue-transport";
import {
  crmCustomerFileLinksEndpoint,
  crmCustomerFilesArchiveEndpoint,
  crmCustomerFilesEndpoint,
  crmCustomerFileUploadsEndpoint,
  crmFileCancelEndpoint,
  crmFileCompleteEndpoint,
  crmFileDownloadEndpoint,
  crmFileDownloadUrlEndpoint,
  crmFileEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

function isFile(value: unknown): value is FileDto {
  return (
    transport.isFileEntry(value) &&
    typeof (value as { version?: unknown }).version === "number"
  );
}

const readFile = transport.readOne(isFile);

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
  if (query.shareable) params.set(FileQueryParam.Shareable, "true");
  const search = params.toString();
  return transport.request(
    search
      ? `${crmCustomerFilesEndpoint(customerId)}?${search}`
      : crmCustomerFilesEndpoint(customerId),
    HttpMethod.Get,
    undefined,
    (payload) => transport.readPage(payload, isFile),
  );
}

function createUpload(
  customerId: string,
  input: CreateFileUploadRequestDto,
): Promise<FileClientResult<FileUploadTicketResponseDto>> {
  return transport.request(
    crmCustomerFileUploadsEndpoint(customerId),
    HttpMethod.Post,
    input,
    (payload) => transport.readTicket(payload, isFile),
  );
}

function completeUpload(fileId: string): Promise<FileClientResult<FileDto>> {
  return transport.request(
    crmFileCompleteEndpoint(fileId),
    HttpMethod.Post,
    undefined,
    readFile,
  );
}

/** The queue transport for this customer; `fields` are the settings shared by every file of a batch. */
function uploadTransport(
  customerId: string,
  fields: Omit<CreateFileUploadRequestDto, "displayName" | "sizeBytes">,
): UploadQueueTransport {
  return transport.uploadQueueTransport(
    (file) => createUpload(customerId, { ...fields, ...file }),
    completeUpload,
    cancelPendingUpload,
  );
}

function cancelPendingUpload(
  fileId: string,
): Promise<FileClientResult<{ cancelled: true }>> {
  return transport.request(
    crmFileCancelEndpoint(fileId),
    HttpMethod.Post,
    undefined,
    transport.readCancelled,
  );
}

function createLink(
  customerId: string,
  input: CreateFileLinkRequestDto,
): Promise<FileClientResult<FileDto>> {
  return transport.request(
    crmCustomerFileLinksEndpoint(customerId),
    HttpMethod.Post,
    input,
    readFile,
  );
}

async function updateFile(
  fileId: string,
  input: UpdateFileRequestDto,
): Promise<FileMutationClientResult> {
  const result = await versionedJsonMutationService.mutate(
    crmFileEndpoint(fileId),
    HttpMethod.Patch,
    input,
    readFile,
    isFile,
    [],
    FileApiErrorCode.Internal,
    transport.readCode,
  );
  return result.ok ? { ok: true, file: result.value } : result;
}

async function deleteFile(
  fileId: string,
  version: number,
): Promise<FileDeleteClientResult> {
  return versionedJsonMutationService.remove(
    crmFileEndpoint(fileId),
    { version },
    isFile,
    transport.readCode,
    FileApiErrorCode.Internal,
  );
}

function readText(fileId: string): Promise<FileClientResult<string>> {
  return transport.readText(crmFileDownloadEndpoint(fileId));
}

function getDownloadUrl(
  fileId: string,
  disposition: StorageDisposition,
): Promise<FileClientResult<string>> {
  return transport.getDownloadUrl(
    crmFileDownloadUrlEndpoint(fileId),
    disposition,
  );
}

function downloadArchive(
  customerId: string,
  fileIds: readonly string[],
): Promise<FileClientResult<string>> {
  return transport.downloadArchive(
    crmCustomerFilesArchiveEndpoint(customerId),
    fileIds,
  );
}

export const filesApiService = {
  listFiles,
  createUpload,
  completeUpload,
  cancelPendingUpload,
  uploadTransport,
  createLink,
  updateFile,
  deleteFile,
  getDownloadUrl,
  downloadArchive,
  readText,
} as const;
