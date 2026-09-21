import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

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

  it("requires every CRM route to reference a central access rule", () => {
    const routesRoot = join(
      process.cwd(),
      "src",
      "app",
      "api",
      "workspace",
      "crm",
    );
    const routeFiles = findRouteFiles(routesRoot);

    expect(routeFiles).not.toHaveLength(0);
    for (const routeFile of routeFiles) {
      const source = readFileSync(routeFile, "utf8");
      expect(
        source,
        `${relative(routesRoot, routeFile)} must use CrmEndpointAccessRule`,
      ).toContain("CrmEndpointAccessRule");
      expect(
        source,
        `${relative(routesRoot, routeFile)} must use withCrmPermission`,
      ).toContain("withCrmPermission");
    }
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

function findRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findRouteFiles(path);
    return entry.isFile() && entry.name === "route.ts" ? [path] : [];
  });
}
