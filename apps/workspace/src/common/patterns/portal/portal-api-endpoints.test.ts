import { describe, expect, it } from "vitest";

import {
  portalConversationEndpoint,
  portalConversationMessagesEndpoint,
  portalConversationReadEndpoint,
  portalTaskCompleteEndpoint,
} from "./portal-api-endpoints";

describe("portalTaskCompleteEndpoint", () => {
  it("builds the completion path below the portal api", () => {
    expect(portalTaskCompleteEndpoint("customer-1", "task-1")).toBe(
      "/api/portal/customer-1/tasks/task-1/complete",
    );
  });

  it("encodes both path segments", () => {
    expect(portalTaskCompleteEndpoint("a/b", "c d")).toBe(
      "/api/portal/a%2Fb/tasks/c%20d/complete",
    );
  });
});

describe("portal conversation endpoints", () => {
  it("builds the conversation paths below the encoded customer", () => {
    expect(portalConversationEndpoint("a/b")).toBe(
      "/api/portal/a%2Fb/conversation",
    );
    expect(portalConversationMessagesEndpoint("c-1")).toBe(
      "/api/portal/c-1/conversation/messages",
    );
    expect(portalConversationReadEndpoint("c-1")).toBe(
      "/api/portal/c-1/conversation/read",
    );
  });
});
