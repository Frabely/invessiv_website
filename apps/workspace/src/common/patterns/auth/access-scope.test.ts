import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AccessScopeKind } from "@invessiv/common/constants/auth/access-scope-types";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";

function actorWith(
  overrides: Pick<WorkspaceActor, "customerPermissions" | "projectPermissions">,
): WorkspaceActor {
  return {
    userId: "user-1",
    workspaceMemberId: "member-1",
    permissions: new Set(),
    ...overrides,
  };
}

describe("accessScope", () => {
  it("returns the customer of a project-only binding as a project customer", () => {
    const scope = accessScope(
      actorWith({
        customerPermissions: new Map(),
        projectPermissions: new Map([
          [
            "project-1",
            {
              customerId: "customer-1",
              permissions: new Set([Permission.CustomersRead]),
            },
          ],
        ]),
      }),
      Permission.CustomersRead,
    );

    expect(scope).toEqual({
      kind: AccessScopeKind.Limited,
      customerIds: new Set(),
      projectIds: new Set(["project-1"]),
      projectCustomerIds: new Set(["customer-1"]),
    });
  });

  it("drops a project binding whose customer is already granted customer-wide", () => {
    const scope = accessScope(
      actorWith({
        customerPermissions: new Map([
          ["customer-1", new Set([Permission.CustomersRead])],
        ]),
        projectPermissions: new Map([
          [
            "project-1",
            {
              customerId: "customer-1",
              permissions: new Set([Permission.CustomersRead]),
            },
          ],
        ]),
      }),
      Permission.CustomersRead,
    );

    expect(scope).toMatchObject({
      customerIds: new Set(["customer-1"]),
      projectIds: new Set(),
      projectCustomerIds: new Set(),
    });
  });
});

describe("canOn", () => {
  it("allows a project permission only for its bound project and customer", () => {
    const actor = actorWith({
      customerPermissions: new Map(),
      projectPermissions: new Map([
        [
          "project-1",
          {
            customerId: "customer-1",
            permissions: new Set([Permission.ProjectsRead]),
          },
        ],
      ]),
    });

    expect(
      canOn(actor, Permission.ProjectsRead, {
        customerId: "customer-1",
        projectId: "project-1",
      }),
    ).toBe(true);
    expect(
      canOn(actor, Permission.ProjectsRead, {
        customerId: "customer-2",
        projectId: "project-1",
      }),
    ).toBe(false);
  });
});
