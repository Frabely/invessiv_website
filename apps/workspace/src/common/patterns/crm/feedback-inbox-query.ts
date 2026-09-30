import { INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  FEEDBACK_INBOX_UNREAD_ONLY,
  FeedbackInboxQueryParam,
} from "@/common/constants/crm/feedback-inbox-query-params";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import {
  buildDialogHref,
  type DialogSearchParamsInput,
  readDialogSearchParam,
} from "@/common/patterns/crm/dialog-query-primitives";

/** Unknown values fall back to the default instead of failing, so an old link still opens the inbox. */
export function readFeedbackInboxFilters(
  searchParams: DialogSearchParamsInput,
): FeedbackInboxFilters {
  const status = readDialogSearchParam(
    searchParams,
    FeedbackInboxQueryParam.Status,
  );
  const customerId = readDialogSearchParam(
    searchParams,
    FeedbackInboxQueryParam.Customer,
  );
  return {
    status:
      INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES.find(
        (value) => value === status,
      ) ?? null,
    unreadOnly:
      readDialogSearchParam(searchParams, FeedbackInboxQueryParam.Unread) ===
      FEEDBACK_INBOX_UNREAD_ONLY,
    customerId: customerId && isUuid(customerId) ? customerId : null,
  };
}

export function hasActiveFeedbackInboxFilters(
  filters: FeedbackInboxFilters,
): boolean {
  return (
    filters.status !== null || filters.unreadOnly || filters.customerId !== null
  );
}

/** Default values stay out of the URL so the plain inbox address remains canonical. */
export function buildFeedbackInboxHref(
  basePath: string,
  filters: FeedbackInboxFilters,
): string {
  const params = new URLSearchParams();
  if (filters.status)
    params.set(FeedbackInboxQueryParam.Status, filters.status);
  if (filters.unreadOnly)
    params.set(FeedbackInboxQueryParam.Unread, FEEDBACK_INBOX_UNREAD_ONLY);
  if (filters.customerId)
    params.set(FeedbackInboxQueryParam.Customer, filters.customerId);
  return buildDialogHref(basePath, params);
}
