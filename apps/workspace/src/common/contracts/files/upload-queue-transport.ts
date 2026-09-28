import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileUploadTicketResponseDto } from "@invessiv/common/contracts/files/file-upload-ticket-response.dto";
import type { FileClientResult } from "./file-client-result";

/**
 * The actor-specific half of an upload: workspace and portal issue tickets and finalize through
 * their own endpoints, while the queue mechanics stay shared.
 */
export interface UploadQueueTransport {
  createTicket(
    file: File,
  ): Promise<FileClientResult<FileUploadTicketResponseDto>>;

  complete(fileId: string): Promise<FileClientResult<FileDto>>;
}
