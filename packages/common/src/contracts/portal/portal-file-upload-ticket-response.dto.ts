import type { StorageUploadTicket } from "../storage/storage-upload-ticket";
import type { PortalFileDto } from "./portal-file.dto";

export interface PortalFileUploadTicketResponseDto {
  /** The pending entry; it appears in lists only after `complete`. */
  file: PortalFileDto;
  /** Short-lived transfer capability; never persist or log it. */
  ticket: StorageUploadTicket;
}
