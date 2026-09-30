import { describe, expect, it } from "vitest";
import { readApiErrorCode } from "./read-api-error-code";

const codes = ["missing", "locked"] as const;

describe("readApiErrorCode", () => {
  it("reads a known code and falls back for unknown or malformed payloads", () => {
    expect(readApiErrorCode({ code: "locked" }, codes, "missing")).toBe(
      "locked",
    );
    expect(readApiErrorCode({ code: "other" }, codes, "missing")).toBe(
      "missing",
    );
    expect(readApiErrorCode({ error: "locked" }, codes, "missing")).toBe(
      "missing",
    );
    expect(readApiErrorCode(null, codes, "missing")).toBe("missing");
  });
});
