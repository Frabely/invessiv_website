import type { FeedbackInboxCustomerDto } from "./feedback-inbox-customer.dto";
import type { FeedbackInboxItemDto } from "./feedback-inbox-item.dto";

/** The internal feedback inbox: the filtered rounds plus the customers the filter can offer. */
export interface FeedbackInboxDto {
  /** Rounds matching the filter, unread first, then longest waiting first. */
  items: FeedbackInboxItemDto[];
  /** Customers with at least one round in the inbox, independent of the active filter, sorted by name. */
  customers: FeedbackInboxCustomerDto[];
}
