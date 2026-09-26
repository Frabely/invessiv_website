import { describe, expect, it, vi } from "vitest";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import { messageService } from "@/server/shared/services/message/message-service";

vi.mock("server-only", () => ({}));

describe("messageService.validateBody", () => {
  it("trims nonempty text and accepts the maximum length", () => {
    expect(messageService.validateBody("  Hallo  ")).toBe("Hallo");
    expect(
      messageService.validateBody("x".repeat(MESSAGE_BODY_MAX_LENGTH)),
    ).toHaveLength(MESSAGE_BODY_MAX_LENGTH);
  });

  it("rejects empty, whitespace, oversized and nonstring content", () => {
    expect(messageService.validateBody("")).toBeNull();
    expect(messageService.validateBody(" \n ")).toBeNull();
    expect(
      messageService.validateBody("x".repeat(MESSAGE_BODY_MAX_LENGTH + 1)),
    ).toBeNull();
    expect(messageService.validateBody({ body: "hello" })).toBeNull();
  });
});
