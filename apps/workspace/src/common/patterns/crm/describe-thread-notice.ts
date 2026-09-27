import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { ThreadNoticeState } from "@/common/contracts/crm/thread-notice-state";
import type { ThreadNoticeTexts } from "@/common/contracts/crm/thread-notice-texts";

/** At most one error line; a failed reload outranks the rate limit, which outranks older pages. */
export function describeThreadNotice(
  thread: ThreadNoticeState,
  texts: ThreadNoticeTexts,
): string | null {
  if (thread.loadFailed) return texts.loadError;
  if (thread.sendError === MessageErrorCode.RateLimited && texts.rateLimited)
    return texts.rateLimited;
  if (thread.olderFailed) return texts.olderError;
  return null;
}
