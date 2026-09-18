import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  CRM_ENDPOINT_ACCESS_RULES,
  CrmEndpointAccessRule,
} from "./crm-endpoint-access-rules";

describe("CRM endpoint access rules", () => {
  it("declares every CRM endpoint exactly once", () => {
    expect(Object.keys(CRM_ENDPOINT_ACCESS_RULES).sort()).toEqual(
      Object.values(CrmEndpointAccessRule).sort(),
    );
  });

  it("keeps scoped project and customer routes bindable", () => {
    expect(
      CRM_ENDPOINT_ACCESS_RULES[CrmEndpointAccessRule.CustomerDetail],
    ).toEqual({
      permission: Permission.CustomersRead,
      scope: "customer",
    });
    expect(
      CRM_ENDPOINT_ACCESS_RULES[CrmEndpointAccessRule.CustomerProjects],
    ).toEqual({
      permission: Permission.ProjectsRead,
      scope: "project",
    });
  });
});
