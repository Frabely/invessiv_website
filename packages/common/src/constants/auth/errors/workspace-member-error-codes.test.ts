import { describe, expect, it } from "vitest";

import {
  WORKSPACE_MEMBER_ERROR_CODE_VALUES,
  WorkspaceMemberErrorCode,
} from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";

describe("WORKSPACE_MEMBER_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...WORKSPACE_MEMBER_ERROR_CODE_VALUES]).toEqual(
      Object.values(WorkspaceMemberErrorCode),
    );
  });

  it("contains no duplicates", () => {
    expect(new Set(WORKSPACE_MEMBER_ERROR_CODE_VALUES).size).toBe(
      WORKSPACE_MEMBER_ERROR_CODE_VALUES.length,
    );
  });

  it("has no email based error, because members are bound by clerk id only", () => {
    for (const code of WORKSPACE_MEMBER_ERROR_CODE_VALUES) {
      expect(code).not.toContain("EMAIL");
    }
  });
});
