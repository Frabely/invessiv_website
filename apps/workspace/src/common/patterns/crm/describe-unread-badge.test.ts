import { describe, expect, it } from "vitest";
import { describeUnreadBadge } from "./describe-unread-badge";

describe("describeUnreadBadge", () => {
  it("names the count and stays empty while everything is read", () => {
    expect(describeUnreadBadge(3, "{count} unread")).toBe("3 unread");
    expect(describeUnreadBadge(0, "{count} unread")).toBeUndefined();
  });
});
