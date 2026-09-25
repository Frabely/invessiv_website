import { describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
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
