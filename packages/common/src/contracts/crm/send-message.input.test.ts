import { describe, expect, it } from "vitest";
import {
  MESSAGE_ATTACHMENTS_MAX,
  MESSAGE_BODY_MAX_LENGTH,
} from "@invessiv/common/constants/crm/message-limits";
import { sendMessageInputSchema } from "@invessiv/common/contracts/crm/send-message.input";

const clientMessageId = "11111111-1111-4111-8111-111111111111";
const fileId = "22222222-2222-4222-8222-222222222222";

describe("sendMessageInputSchema", () => {
  it("trims nonempty text and accepts the maximum length", () => {
    expect(
      sendMessageInputSchema.parse({ body: "  Hallo  ", clientMessageId }),
    ).toEqual({
      body: "Hallo",
      clientMessageId,
      attachmentFileIds: [],
      releaseHiddenAttachments: false,
    });
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

  it("accepts an attachment without text and lower-cases its id", () => {
    expect(
      sendMessageInputSchema.parse({
        body: " ",
        clientMessageId,
        attachmentFileIds: [fileId.toUpperCase()],
        releaseHiddenAttachments: true,
      }),
    ).toMatchObject({
      body: "",
      attachmentFileIds: [fileId],
      releaseHiddenAttachments: true,
    });
  });

  it("rejects duplicate, malformed and too many attachments", () => {
    const send = (attachmentFileIds: unknown) =>
      sendMessageInputSchema.safeParse({
        body: "hi",
        clientMessageId,
        attachmentFileIds,
      }).success;
    expect(send([fileId, fileId.toUpperCase()])).toBe(false);
    expect(send(["x"])).toBe(false);
    expect(
      send(
        Array.from({ length: MESSAGE_ATTACHMENTS_MAX + 1 }, () =>
          crypto.randomUUID(),
        ),
      ),
    ).toBe(false);
  });
});
