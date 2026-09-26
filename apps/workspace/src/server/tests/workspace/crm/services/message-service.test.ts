import { describe, expect, it, vi } from "vitest";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import { sendMessageInputSchema } from "@invessiv/common/contracts/crm/send-message.input";

vi.mock("server-only", () => ({}));

describe("sendMessageInputSchema", () => {
  it("trims nonempty text and accepts the maximum length", () => {
    expect(sendMessageInputSchema.parse({ body: "  Hallo  " }).body).toBe(
      "Hallo",
    );
    expect(
      sendMessageInputSchema.parse({
        body: "x".repeat(MESSAGE_BODY_MAX_LENGTH),
      }).body,
    ).toHaveLength(MESSAGE_BODY_MAX_LENGTH);
  });

  it("rejects empty, whitespace, oversized and nonstring content", () => {
    expect(sendMessageInputSchema.safeParse({ body: "" }).success).toBe(false);
    expect(sendMessageInputSchema.safeParse({ body: " \n " }).success).toBe(
      false,
    );
    expect(
      sendMessageInputSchema.safeParse({
        body: "x".repeat(MESSAGE_BODY_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(sendMessageInputSchema.safeParse({ body: {} }).success).toBe(false);
  });
});
