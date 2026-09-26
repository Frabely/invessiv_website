import { describe, expect, it } from "vitest";
import { PortalTaskErrorCode } from "./portal-task-error-codes";

describe("PortalTaskErrorCode", () => {
  it("keeps distinct codes without duplicates", () => {
    expect(PortalTaskErrorCode).toEqual({
      NotFound: "not_found",
      Unavailable: "unavailable",
    });
    const values = Object.values(PortalTaskErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });
});
