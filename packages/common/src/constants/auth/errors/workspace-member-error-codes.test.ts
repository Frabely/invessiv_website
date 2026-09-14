import { describe, expect, it } from "vitest";

import {
  WORKSPACE_MEMBER_ERROR_CODE_VALUES,
  WorkspaceMemberErrorCode,
} from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";

describe("WORKSPACE_MEMBER_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect(WORKSPACE_MEMBER_ERROR_CODE_VALUES).toEqual([
      "MEMBER_NOT_FOUND",
      "VALIDATION_ERROR",
      "CLERK_ACCOUNT_NOT_FOUND",
      "CLERK_ACCOUNT_INCOMPLETE",
      "CLERK_ACCOUNT_ALREADY_LINKED",
      "CLERK_UNAVAILABLE",
      "ROLE_NOT_ASSIGNABLE",
      "OWNER_ROLE_NOT_ASSIGNABLE",
      "MEMBER_WITHOUT_ROLE",
      "ALREADY_OWNER",
      "NOT_OWNER",
      "LAST_ACTIVE_OWNER",
      "SELF_OWNER_REVOCATION",
      "MEMBER_ALREADY_ACTIVE",
      "MEMBER_ALREADY_INACTIVE",
      "SELF_DEACTIVATION",
      "MEMBER_HAS_OPEN_RESPONSIBILITIES",
      "MEMBER_INACTIVE",
      "INTERNAL",
    ]);
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
