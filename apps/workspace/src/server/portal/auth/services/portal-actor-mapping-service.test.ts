import { describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalActorRow } from "@invessiv/common/contracts/auth/rows/portal-actor-row";
import { PortalActorResolutionError } from "@/common/constants/auth/portal-actor-resolution-errors";
import { portalActorMappingService } from "@/server/portal/auth/services/portal-actor-mapping-service";

vi.mock("server-only", () => ({}));

const CUSTOMER_ID = "customer-uuid-1";

function row(overrides: Partial<PortalActorRow> = {}): PortalActorRow {
  return {
    user_id: "user-uuid-1",
    user_active: true,
    membership_id: "membership-uuid-1",
    person_id: "person-uuid-1",
    revoked_at: null,
    permission_key: Permission.PortalAccess,
    ...overrides,
  };
}

describe("portalActorMappingService.mapRowsToResolution", () => {
  it("reports a missing user when no row exists", () => {
    expect(
      portalActorMappingService.mapRowsToResolution([], CUSTOMER_ID),
    ).toEqual({ ok: false, code: PortalActorResolutionError.UserMissing });
  });

  it("rejects an inactive user even with an active membership and portal.access", () => {
    expect(
      portalActorMappingService.mapRowsToResolution(
        [row({ user_active: false })],
        CUSTOMER_ID,
      ),
    ).toEqual({ ok: false, code: PortalActorResolutionError.UserInactive });
  });

  it("rejects a user without a membership for this customer", () => {
    expect(
      portalActorMappingService.mapRowsToResolution(
        [
          row({
            membership_id: null,
            person_id: null,
            revoked_at: null,
            permission_key: null,
          }),
        ],
        CUSTOMER_ID,
      ),
    ).toEqual({
      ok: false,
      code: PortalActorResolutionError.MembershipMissing,
    });
  });

  it("rejects a revoked membership", () => {
    expect(
      portalActorMappingService.mapRowsToResolution(
        [row({ revoked_at: new Date("2026-01-01T00:00:00Z") })],
        CUSTOMER_ID,
      ),
    ).toEqual({
      ok: false,
      code: PortalActorResolutionError.MembershipMissing,
    });
  });

  it("rejects a membership whose roles never granted portal.access", () => {
    expect(
      portalActorMappingService.mapRowsToResolution(
        [row({ permission_key: null })],
        CUSTOMER_ID,
      ),
    ).toEqual({ ok: false, code: PortalActorResolutionError.AccessDenied });
  });

  it("builds the actor from the union of all granted permissions for that customer", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({ permission_key: Permission.PortalAccess }),
        row({ permission_key: Permission.PortalAccess }),
      ],
      CUSTOMER_ID,
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.actor).toMatchObject({
      userId: "user-uuid-1",
      membershipId: "membership-uuid-1",
      customerId: CUSTOMER_ID,
      personId: "person-uuid-1",
      permissions: new Set([Permission.PortalAccess]),
    });
    expect(result.ok && result.actor.projectPermissions.size).toBe(0);
  });

  it("drops unknown or workspace-realm permission keys instead of trusting them", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({ permission_key: Permission.PortalAccess }),
        row({ permission_key: Permission.CustomersRead }),
        row({ permission_key: "portal.made_up" }),
      ],
      CUSTOMER_ID,
    );

    expect(result.ok && [...result.actor.permissions]).toEqual([
      Permission.PortalAccess,
    ]);
  });
});
