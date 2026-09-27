import { describe, expect, it, vi } from "vitest";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import { sendMessageInputSchema } from "@invessiv/common/contracts/crm/send-message.input";

vi.mock("server-only", () => ({}));

const clientMessageId = "11111111-1111-4111-8111-111111111111";

describe("sendMessageInputSchema", () => {
  it("trims nonempty text and accepts the maximum length", () => {
    expect(
      sendMessageInputSchema.parse({ body: "  Hallo  ", clientMessageId }).body,
    ).toBe("Hallo");
    expect(
      sendMessageInputSchema.parse({
        body: "x".repeat(MESSAGE_BODY_MAX_LENGTH),
        clientMessageId,
      }).body,
    ).toHaveLength(MESSAGE_BODY_MAX_LENGTH);
  });

  it("rejects empty, whitespace, oversized and nonstring content", () => {
    expect(
      sendMessageInputSchema.safeParse({ body: "", clientMessageId }).success,
    ).toBe(false);
    expect(
      sendMessageInputSchema.safeParse({ body: " \n ", clientMessageId })
        .success,
    ).toBe(false);
    expect(
      sendMessageInputSchema.safeParse({
        body: "x".repeat(MESSAGE_BODY_MAX_LENGTH + 1),
        clientMessageId,
      }).success,
    ).toBe(false);
    expect(
      sendMessageInputSchema.safeParse({ body: {}, clientMessageId }).success,
    ).toBe(false);
    expect(sendMessageInputSchema.safeParse({ body: "hello" }).success).toBe(
      false,
    );
  });
});
