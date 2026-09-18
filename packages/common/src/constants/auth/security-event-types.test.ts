import { describe, expect, it } from "vitest";

import {
  SECURITY_EVENT_TYPE_VALUES,
  SecurityEventType,
} from "@invessiv/common/constants/auth/security-event-types";
import {
  SECURITY_SUBJECT_TYPE_VALUES,
  SecuritySubjectType,
} from "@invessiv/common/constants/auth/security-subject-types";

describe("SecurityEventType", () => {
  it("contains the exact values without duplicates", () => {
    expect(SECURITY_EVENT_TYPE_VALUES).toEqual([
      "workspace_owner_bootstrapped",
      "workspace_member_added",
      "workspace_member_roles_changed",
      "workspace_owner_granted",
      "workspace_owner_revoked",
      "workspace_member_deactivated",
      "workspace_member_activated",
      "workspace_responsibilities_handed_over",
      "role_created",
      "role_updated",
      "workspace_member_access_scope_granted",
      "workspace_member_access_scope_revoked",
    ]);
    expect(SECURITY_EVENT_TYPE_VALUES).toEqual(
      Object.values(SecurityEventType),
    );
    expect(new Set(SECURITY_EVENT_TYPE_VALUES).size).toBe(
      SECURITY_EVENT_TYPE_VALUES.length,
    );
  });
});

describe("SecuritySubjectType", () => {
  it("contains the exact values without duplicates", () => {
    expect(SECURITY_SUBJECT_TYPE_VALUES).toEqual(["workspace_member", "role"]);
    expect(SECURITY_SUBJECT_TYPE_VALUES).toEqual(
      Object.values(SecuritySubjectType),
    );
    expect(new Set(SECURITY_SUBJECT_TYPE_VALUES).size).toBe(
      SECURITY_SUBJECT_TYPE_VALUES.length,
    );
  });
});
