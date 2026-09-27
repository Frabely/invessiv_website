import { describe, expect, it } from "vitest";
import {
  MESSAGE_DRAFT_STORAGE_KEY_PREFIX,
  MESSAGE_PENDING_STORAGE_KEY_PREFIX,
} from "./message-draft-storage";

describe("message storage prefixes", () => {
  it("uses distinct keys for drafts and pending sends", () => {
    expect({
      draft: MESSAGE_DRAFT_STORAGE_KEY_PREFIX,
      pending: MESSAGE_PENDING_STORAGE_KEY_PREFIX,
    }).toEqual({
      draft: "invessiv:workspace:message-draft:",
      pending: "invessiv:workspace:pending-message:",
    });
    expect(
      new Set([
        MESSAGE_DRAFT_STORAGE_KEY_PREFIX,
        MESSAGE_PENDING_STORAGE_KEY_PREFIX,
      ]).size,
    ).toBe(2);
  });
});
