import { describe, expect, it } from "vitest";

import {
  MEMBER_ROLES_TAB_VALUES,
  MemberRolesTab,
} from "@/common/constants/access/member-roles-tabs";

describe("MemberRolesTab", () => {
  it("lists every tab of the const object without duplicates", () => {
    expect([...MEMBER_ROLES_TAB_VALUES]).toEqual(Object.values(MemberRolesTab));
    expect(new Set(MEMBER_ROLES_TAB_VALUES).size).toBe(
      MEMBER_ROLES_TAB_VALUES.length,
    );
  });
});
