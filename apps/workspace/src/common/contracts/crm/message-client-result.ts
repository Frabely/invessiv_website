import type { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";

/** Outcome of a chat request; a network failure maps to `internal`. */
export type MessageClientResult<TValue> =
  { ok: true; value: TValue } | { ok: false; code: MessageErrorCode };
