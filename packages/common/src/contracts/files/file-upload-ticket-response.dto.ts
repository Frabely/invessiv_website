import type { StorageUploadTicket } from "../storage/storage-upload-ticket";
import type { FileDto } from "./file.dto";

export interface FileUploadTicketResponseDto {
  /** The pending entry; it becomes visible only after `complete`. */
  file: FileDto;
  /** Short-lived transfer capability; never persist or log it. */
  ticket: StorageUploadTicket;
}
