import type { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";

/** The request outcomes of a conversation that decide which error line is shown. */
export type ThreadNoticeState = {
  loadFailed: boolean;
  olderFailed: boolean;
  /** Code of the last failed send; null once a send succeeds again. */
  sendError: MessageErrorCode | null;
};
