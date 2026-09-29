/** Which attachment actions the composer offers; the send route checks every file again. */
export interface ConversationAttachmentAccessDto {
  /** May reference existing entries the viewer can read. */
  pick: boolean;
  /** May upload a new customer-wide file from the chat. */
  upload: boolean;
}
