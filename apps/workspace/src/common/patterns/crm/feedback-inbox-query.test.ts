import { describe, expect, it } from "vitest";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import {
  FEEDBACK_INBOX_UNREAD_ONLY,
  FeedbackInboxQueryParam,
} from "@/common/constants/crm/feedback-inbox-query-params";
import {
  buildFeedbackInboxHref,
  hasActiveFeedbackInboxFilters,
  readFeedbackInboxFilters,
} from "./feedback-inbox-query";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const NO_FILTERS = { status: null, unreadOnly: false, customerId: null };

describe("feedback inbox constants", () => {
  it("contain the exact values without duplicates", () => {
    expect(FeedbackInboxQueryParam).toEqual({
      Status: "status",
      Unread: "unread",
      Customer: "customer",
    });
    expect(new Set(Object.values(FeedbackInboxQueryParam)).size).toBe(3);
    expect(FEEDBACK_INBOX_UNREAD_ONLY).toBe("1");
  });
});

describe("readFeedbackInboxFilters", () => {
  it("reads status, unread and customer", () => {
    expect(
      readFeedbackInboxFilters({
        status: "in_discussion",
        unread: "1",
        customer: CUSTOMER_ID,
      }),
    ).toEqual({
      status: FeedbackRoundStatus.InDiscussion,
      unreadOnly: true,
      customerId: CUSTOMER_ID,
    });
  });

  it("falls back to the defaults for unknown or out-of-queue values", () => {
    expect(
      readFeedbackInboxFilters({
        status: FeedbackRoundStatus.Open,
        unread: "yes",
        customer: "x' or 1=1",
      }),
    ).toEqual(NO_FILTERS);
    expect(
      readFeedbackInboxFilters({ status: FeedbackRoundStatus.Completed }),
    ).toEqual(NO_FILTERS);
  });

  it("ignores repeated parameters", () => {
    expect(
      readFeedbackInboxFilters({ customer: [CUSTOMER_ID, CUSTOMER_ID] }),
    ).toEqual(NO_FILTERS);
  });
});

describe("buildFeedbackInboxHref", () => {
  it("keeps the default address free of parameters", () => {
    expect(buildFeedbackInboxHref("/de/crm/feedback", NO_FILTERS)).toBe(
      "/de/crm/feedback",
    );
    expect(hasActiveFeedbackInboxFilters(NO_FILTERS)).toBe(false);
  });

  it("round-trips every active filter", () => {
    const filters = {
      status: FeedbackRoundStatus.Submitted,
      unreadOnly: true,
      customerId: CUSTOMER_ID,
    };
    const href = buildFeedbackInboxHref("/de/crm/feedback", filters);
    const params = Object.fromEntries(
      new URL(href, "https://example.com").searchParams,
    );
    expect(readFeedbackInboxFilters(params)).toEqual(filters);
    expect(hasActiveFeedbackInboxFilters(filters)).toBe(true);
  });
});
