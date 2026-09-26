import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { customers } from "@invessiv/db/record-configuration";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { portalAccessCondition } from "./portal-access-condition";
import { portalCanOn } from "./portal-can-on";

vi.mock("server-only", () => ({}));

const actor = createPortalActor({
  userId: "user-1",
  membershipId: "membership-1",
  customerId: "customer-1",
  personId: "person-1",
  permissions: new Set([Permission.PortalAccess]),
  projectPermissions: new Map(),
});

const ownerView = createPortalOwnerView({
  userId: "owner-1",
  customerId: "customer-1",
  permissions: new Set([Permission.PortalAccess, Permission.PortalTasksRead]),
});

const dialect = new PgDialect();

function render(condition: SQL) {
  return dialect.sqlToQuery(condition);
}

describe("portalCanOn.forActor", () => {
  it("only grants permissions held by the verified portal actor", () => {
    expect(
      portalCanOn.forActor(actor, Permission.PortalAccess, {
        customerId: "customer-1",
      }),
    ).toBe(true);
    expect(
      portalCanOn.forActor(actor, Permission.CustomersRead, {
        customerId: "customer-1",
      }),
    ).toBe(false);
  });
});

describe("portalCanOn.forReader", () => {
  it("treats a portal actor exactly like forActor", () => {
    expect(
      portalCanOn.forReader(actor, Permission.PortalAccess, {
        customerId: "customer-1",
      }),
    ).toBe(true);
    expect(
      portalCanOn.forReader(actor, Permission.PortalAccess, {
        customerId: "customer-2",
      }),
    ).toBe(false);
  });

  it("binds an owner view to its customer and its read permissions", () => {
    expect(
      portalCanOn.forReader(ownerView, Permission.PortalTasksRead, {
        customerId: "customer-1",
        projectId: "project-1",
      }),
    ).toBe(true);
    expect(
      portalCanOn.forReader(ownerView, Permission.PortalTasksComplete, {
        customerId: "customer-1",
      }),
    ).toBe(false);
    expect(
      portalCanOn.forReader(ownerView, Permission.PortalTasksRead, {
        customerId: "customer-2",
      }),
    ).toBe(false);
  });
});

describe("portalAccessCondition", () => {
  const columns = { customerId: customers.id };

  it("filters an owner view to its customer", () => {
    const query = render(
      portalAccessCondition.forReader(
        ownerView,
        Permission.PortalTasksRead,
        columns,
      ),
    );
    expect(query.sql).toContain('"customers"."id" = $1');
    expect(query.params).toEqual(["customer-1"]);
  });

  it("denies everything when the reader lacks the permission", () => {
    expect(
      render(
        portalAccessCondition.forReader(
          ownerView,
          Permission.PortalProjectsRead,
          columns,
        ),
      ).sql,
    ).toBe("FALSE");
    expect(
      render(
        portalAccessCondition.forActor(
          actor,
          Permission.PortalTasksRead,
          columns,
        ),
      ).sql,
    ).toBe("FALSE");
  });

  it("filters a portal actor to its customer", () => {
    expect(
      render(
        portalAccessCondition.forActor(actor, Permission.PortalAccess, columns),
      ).params,
    ).toEqual(["customer-1"]);
  });
});
