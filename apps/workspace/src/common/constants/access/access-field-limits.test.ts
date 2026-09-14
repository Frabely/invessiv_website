import { describe, expect, it } from "vitest";

import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";

describe("AccessFieldLimits", () => {
  it("contains the exact limits", () => {
    expect(AccessFieldLimits).toEqual({
      RoleNameMaxLength: 80,
      RoleDescriptionMaxLength: 280,
      ClerkUserIdMaxLength: 191,
      ClerkCandidateQueryMaxLength: 100,
      AssignedRoleIdsMax: 50,
    });
  });
});
