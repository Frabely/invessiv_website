import { describe, expect, it } from "vitest";
import {
  PORTAL_TASK_ERROR_CODE_VALUES,
  PortalTaskErrorCode,
} from "./portal-task-error-codes";

describe("PortalTaskErrorCode", () => {
  it("keeps distinct codes without duplicates", () => {
    expect(PortalTaskErrorCode).toEqual({
      NotFound: "not_found",
      Validation: "validation",
      NoAssignee: "no_assignee",
      LimitReached: "limit_reached",
      Unavailable: "unavailable",
    });
    expect(PORTAL_TASK_ERROR_CODE_VALUES).toEqual(
      Object.values(PortalTaskErrorCode),
    );
    expect(new Set(PORTAL_TASK_ERROR_CODE_VALUES).size).toBe(
      PORTAL_TASK_ERROR_CODE_VALUES.length,
    );
  });
});
