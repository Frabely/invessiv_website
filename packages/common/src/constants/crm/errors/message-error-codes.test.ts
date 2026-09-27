import { describe, expect, it } from "vitest";
import {
  MESSAGE_ERROR_CODE_VALUES,
  MessageErrorCode,
} from "@invessiv/common/constants/crm/errors/message-error-codes";

describe("MessageErrorCode", () => {
  it("contains the exact codes without duplicates", () => {
    expect(MessageErrorCode).toEqual({
      NotFound: "NOT_FOUND",
      ValidationError: "VALIDATION_ERROR",
      Forbidden: "FORBIDDEN",
      VersionConflict: "VERSION_CONFLICT",
      RateLimited: "RATE_LIMITED",
      Internal: "INTERNAL",
    });
    expect(MESSAGE_ERROR_CODE_VALUES).toEqual(Object.values(MessageErrorCode));
    expect(new Set(MESSAGE_ERROR_CODE_VALUES).size).toBe(
      MESSAGE_ERROR_CODE_VALUES.length,
    );
  });
});
