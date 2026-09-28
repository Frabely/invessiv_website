import type { HttpMethod } from "@invessiv/common";

/** Server boundary result; never persist or log its URL. */
export interface StorageUploadTicket {
  url: string;
  method: typeof HttpMethod.Put;
  headers: Record<string, string>;
}
