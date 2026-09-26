import { describe, expect, it } from "vitest";
import {
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_PAGE_SIZE,
  PORTAL_MESSAGES_PER_HOUR,
} from "./message-limits";
import { MessageErrorCode } from "./message-error-codes";
import {
  MESSAGE_SENDER_SIDE_VALUES,
  MESSAGE_TYPE_VALUES,
  MessageSenderSide,
  MessageType,
} from "./message-types";

describe("message constants", () => {
  it("exposes the exact message types and sender sides without duplicates", () => {
    expect(MessageType).toEqual({ Text: "text", System: "system" });
    expect(MESSAGE_TYPE_VALUES).toEqual(Object.values(MessageType));
    expect(new Set(MESSAGE_TYPE_VALUES).size).toBe(MESSAGE_TYPE_VALUES.length);
    expect(MessageSenderSide).toEqual({
      Internal: "internal",
      Customer: "customer",
      System: "system",
    });
    expect(MESSAGE_SENDER_SIDE_VALUES).toEqual(
      Object.values(MessageSenderSide),
    );
    expect(new Set(MESSAGE_SENDER_SIDE_VALUES).size).toBe(
      MESSAGE_SENDER_SIDE_VALUES.length,
    );
  });

  it("keeps validation, pagination and portal throttling limits explicit", () => {
    expect({
      MESSAGE_BODY_MAX_LENGTH,
      MESSAGE_PAGE_SIZE,
      PORTAL_MESSAGES_PER_HOUR,
    }).toEqual({
      MESSAGE_BODY_MAX_LENGTH: 10_000,
      MESSAGE_PAGE_SIZE: 50,
      PORTAL_MESSAGES_PER_HOUR: 60,
    });
  });

  it("exposes distinct error codes", () => {
    expect(MessageErrorCode).toEqual({
      NotFound: "NOT_FOUND",
      ValidationError: "VALIDATION_ERROR",
      Forbidden: "FORBIDDEN",
      VersionConflict: "VERSION_CONFLICT",
      Internal: "INTERNAL",
    });
    expect(new Set(Object.values(MessageErrorCode)).size).toBe(
      Object.values(MessageErrorCode).length,
    );
  });
});
