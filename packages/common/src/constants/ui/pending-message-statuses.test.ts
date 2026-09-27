import { describe, expect, it } from "vitest";

import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";

describe("PendingMessageStatus", () => {
  it("contains the exact send states without duplicates", () => {
    expect(PendingMessageStatus).toEqual({
      Sending: "sending",
      Failed: "failed",
    });
    const values = Object.values(PendingMessageStatus);
    expect(new Set(values).size).toBe(values.length);
  });
});
