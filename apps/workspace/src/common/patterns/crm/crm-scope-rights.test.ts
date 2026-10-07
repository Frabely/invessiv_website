import { describe, expect, it } from "vitest";
import { crmScopeRights } from "./crm-scope-rights";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

const projects = [
  { id: "p1", title: "Website" },
  { id: "p2", title: "Logo" },
];

describe("crmScopeRights", () => {
  it("does not let a project grant open customer-wide or foreign-customer scopes", () => {
    const actor: WorkspaceActor = {
      userId: "u1",
      workspaceMemberId: "m1",
      permissions: new Set(),
      customerPermissions: new Map(),
      projectPermissions: new Map([
        [
          "p1",
          {
            customerId: "c1",
            permissions: new Set([Permission.CredentialsRead]),
          },
        ],
        [
          "p2",
          {
            customerId: "other",
            permissions: new Set([Permission.CredentialsRead]),
          },
        ],
      ]),
    };
    expect(
      crmScopeRights.forPermission(
        actor,
        Permission.CredentialsRead,
        "c1",
        projects,
      ),
    ).toEqual({ customerWide: false, projectIds: ["p1"] });
    expect(
      crmScopeRights.forPermission(actor, Permission.FilesRead, "c1", projects),
    ).toEqual({ customerWide: false, projectIds: [] });
    actor.customerPermissions = new Map([
      ["c1", new Set([Permission.FilesRead])],
    ]);
    expect(
      crmScopeRights.forPermission(actor, Permission.FilesRead, "c1", projects),
    ).toEqual({ customerWide: true, projectIds: ["p1", "p2"] });
  });

  it("includes write-only projects without retaining hidden projects or extra DTO fields", () => {
    const read = { customerWide: false, projectIds: ["p1"] };
    const write = { customerWide: false, projectIds: ["p2"] };
    expect(
      crmScopeRights.projectsFor(read, write, [
        ...projects,
        { id: "hidden", title: "Private" },
      ]),
    ).toEqual(projects);
    expect(crmScopeRights.targets(read, projects)).toEqual(["p1"]);
  });
  it("keeps customer-wide entries closed to project grants", () => {
    const rights = { customerWide: false, projectIds: ["p1"] };
    expect(crmScopeRights.allows(rights, null)).toBe(false);
    expect(crmScopeRights.allows(rights, "p1")).toBe(true);
    expect(crmScopeRights.allows(rights, "p2")).toBe(false);
    expect(crmScopeRights.any(rights)).toBe(true);
    expect(crmScopeRights.any({ customerWide: false, projectIds: [] })).toBe(
      false,
    );
  });

  it("lists writable targets with customer-wide first", () => {
    expect(
      crmScopeRights.targets(
        { customerWide: true, projectIds: ["p2"] },
        projects,
      ),
    ).toEqual([null, "p2"]);
    expect(
      crmScopeRights.targets({ customerWide: false, projectIds: [] }, projects),
    ).toEqual([]);
  });
});
