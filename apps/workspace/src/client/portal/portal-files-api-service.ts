import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import type { CreatePortalFileLinkRequestDto } from "@invessiv/common/contracts/portal/create-portal-file-link-request.dto";
import type { CreatePortalFileUploadRequestDto } from "@invessiv/common/contracts/portal/create-portal-file-upload-request.dto";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import type { PortalFileUploadTicketResponseDto } from "@invessiv/common/contracts/portal/portal-file-upload-ticket-response.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { fileApiTransportService as transport } from "@/client/shared/file-api-transport-service";
import { FileQueryParam } from "@/common/constants/files/file-query-params";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import {
  portalFileCancelEndpoint,
  portalFileCompleteEndpoint,
  portalFileDownloadEndpoint,
  portalFileDownloadUrlEndpoint,
  portalFileLinksEndpoint,
  portalFilesArchiveEndpoint,
  portalFilesEndpoint,
  portalFileUploadsEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

function isFile(value: unknown): value is PortalFileDto {
  return (
    transport.isFileEntry(value) &&
    typeof (value as { origin?: unknown }).origin === "string"
  );
}

const readFile = transport.readOne(isFile);

function listFiles(
  customerId: string,
  origin: PortalFileOrigin,
  page: number,
): Promise<FileClientResult<PortalFileListPageDto>> {
  const params = new URLSearchParams({
    [FileQueryParam.Origin]: origin,
    [FileQueryParam.Page]: String(page),
  });
  return transport.request(
    `${portalFilesEndpoint(customerId)}?${params.toString()}`,
    HttpMethod.Get,
    undefined,
    (payload) => transport.readPage(payload, isFile),
  );
}

function createUpload(
  customerId: string,
  input: CreatePortalFileUploadRequestDto,
): Promise<FileClientResult<PortalFileUploadTicketResponseDto>> {
  return transport.request(
    portalFileUploadsEndpoint(customerId),
    HttpMethod.Post,
    input,
    (payload) => transport.readTicket(payload, isFile),
  );
}

function completeUpload(
  customerId: string,
  fileId: string,
): Promise<FileClientResult<PortalFileDto>> {
  return transport.request(
    portalFileCompleteEndpoint(customerId, fileId),
    HttpMethod.Post,
    undefined,
    readFile,
  );
}

function cancelPendingUpload(
  customerId: string,
  fileId: string,
): Promise<FileClientResult<{ cancelled: true }>> {
  return transport.request(
    portalFileCancelEndpoint(customerId, fileId),
    HttpMethod.Post,
    undefined,
    transport.readCancelled,
  );
}

function createLink(
  customerId: string,
  input: CreatePortalFileLinkRequestDto,
): Promise<FileClientResult<PortalFileDto>> {
  return transport.request(
    portalFileLinksEndpoint(customerId),
    HttpMethod.Post,
    input,
    readFile,
  );
}

function readText(
  customerId: string,
  fileId: string,
): Promise<FileClientResult<string>> {
  return transport.readText(portalFileDownloadEndpoint(customerId, fileId));
}

function getDownloadUrl(
  customerId: string,
  fileId: string,
  disposition: StorageDisposition,
): Promise<FileClientResult<string>> {
  return transport.getDownloadUrl(
    portalFileDownloadUrlEndpoint(customerId, fileId),
    disposition,
  );
}

function downloadArchive(
  customerId: string,
  fileIds: readonly string[],
): Promise<FileClientResult<Blob>> {
  return transport.downloadArchive(
    portalFilesArchiveEndpoint(customerId),
    fileIds,
  );
}

export const portalFilesApiService = {
  listFiles,
  createUpload,
  completeUpload,
  cancelPendingUpload,
  createLink,
  readText,
  getDownloadUrl,
  downloadArchive,
} as const;
