import type { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ConversationOwnerAssignment } from "./conversation-owner-assignment";

/** A conflict carries the current assignment so the select can show it without a reload. */
export type ConversationOwnerClientResult =
  | { ok: true; assignment: ConversationOwnerAssignment }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: ConversationOwnerAssignment;
    }
  | { ok: false; code: MessageErrorCode };
