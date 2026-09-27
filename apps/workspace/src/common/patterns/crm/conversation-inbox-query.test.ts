import { describe, expect, it } from "vitest";
import {
  CONVERSATION_INBOX_FILTER_VALUES,
  ConversationInboxFilter,
} from "@/common/constants/crm/conversation-inbox-filters";
import { ConversationInboxQueryParam } from "@/common/constants/crm/conversation-inbox-query-params";
import {
  buildConversationInboxHref,
  readConversationInboxRequest,
} from "./conversation-inbox-query";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";

describe("conversation inbox constants", () => {
  it("contain the exact values without duplicates", () => {
    expect(ConversationInboxQueryParam).toEqual({
      Customer: "customer",
      Filter: "filter",
    });
    expect(CONVERSATION_INBOX_FILTER_VALUES).toEqual(
      Object.values(ConversationInboxFilter),
    );
    expect(new Set(CONVERSATION_INBOX_FILTER_VALUES).size).toBe(2);
  });
});

describe("readConversationInboxRequest", () => {
  it("reads a valid selection and filter", () => {
    expect(
      readConversationInboxRequest({ customer: CUSTOMER_ID, filter: "mine" }),
    ).toEqual({
      customerId: CUSTOMER_ID,
      filter: ConversationInboxFilter.Mine,
    });
  });

  it("ignores malformed ids and unknown filters", () => {
    expect(
      readConversationInboxRequest({ customer: "x' or 1=1", filter: "other" }),
    ).toEqual({ customerId: null, filter: ConversationInboxFilter.All });
  });
});

describe("buildConversationInboxHref", () => {
  it("keeps the default filter out of the URL", () => {
    expect(
      buildConversationInboxHref("/de/crm/messages", {
        customerId: null,
        filter: ConversationInboxFilter.All,
      }),
    ).toBe("/de/crm/messages");
    expect(
      buildConversationInboxHref("/de/crm/messages", {
        customerId: CUSTOMER_ID,
        filter: ConversationInboxFilter.Mine,
      }),
    ).toBe(`/de/crm/messages?filter=mine&customer=${CUSTOMER_ID}`);
  });
});
