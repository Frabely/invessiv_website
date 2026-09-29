import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { StorageUploadTicket } from "@invessiv/common/contracts/storage/storage-upload-ticket";
import type { FileClientResult } from "./file-client-result";

/**
 * The actor-specific half of an upload: workspace and portal issue tickets and finalize through
 * their own endpoints with their own DTOs, while the queue mechanics stay shared.
 */
export interface UploadQueueTransport<TFile extends { id: string } = FileDto> {
  createTicket(
    file: File,
  ): Promise<FileClientResult<{ file: TFile; ticket: StorageUploadTicket }>>;

  complete(fileId: string): Promise<FileClientResult<TFile>>;

  /** Releases an unfinished ticket before retrying or after a cancelled transfer. */
  cancelPending?(
    fileId: string,
  ): Promise<FileClientResult<{ cancelled: true }>>;
}
