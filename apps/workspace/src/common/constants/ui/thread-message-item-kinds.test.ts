import { describe, expect, it } from "vitest";
import { ThreadMessageItemKind } from "./thread-message-item-kinds";

describe("ThreadMessageItemKind", () => {
  it("defines distinct thread item kinds", () => {
    expect(ThreadMessageItemKind).toEqual({
      Message: "message",
      Pending: "pending",
    });
    expect(new Set(Object.values(ThreadMessageItemKind)).size).toBe(
      Object.values(ThreadMessageItemKind).length,
    );
  });
});
