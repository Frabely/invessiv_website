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
    first_name: " Sam ",
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

  it("resolves a newly redeemed membership after an older membership was revoked", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({
          membership_id: "old-membership",
          revoked_at: new Date("2026-01-01T00:00:00Z"),
        }),
        row({ membership_id: "new-membership", revoked_at: null }),
      ],
      CUSTOMER_ID,
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.actor.membershipId).toBe("new-membership");
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
      firstName: "Sam",
      permissions: new Set([Permission.PortalAccess]),
    });
    expect(result.ok && result.actor.projectPermissions.size).toBe(0);
  });

  it("denies access when the resolved membership itself has no grant, even if a second membership row of the same user and customer does", () => {
    // Two different `person_id` contact assignments can both resolve to this `(user_id,
    // customer_id)` pair. A second membership's role must never grant permissions to the actor
    // built from the first.
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({
          membership_id: "membership-uuid-1",
          person_id: "person-uuid-1",
          revoked_at: null,
          permission_key: null,
        }),
        row({
          membership_id: "membership-uuid-2",
          person_id: "person-uuid-2",
          revoked_at: null,
          permission_key: Permission.PortalAccess,
        }),
      ],
      CUSTOMER_ID,
    );

    expect(result).toEqual({
      ok: false,
      code: PortalActorResolutionError.AccessDenied,
    });
  });

  it("picks the first row's membership deterministically when two are active for this customer", () => {
    // Whether this is the right membership depends on the query ordering rows by activation
    // date before they ever reach this function — this only pins that the mapper itself always
    // takes the first match instead of leaving it to arbitrary row order.
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({
          membership_id: "membership-earliest",
          person_id: "person-earliest",
        }),
        row({
          membership_id: "membership-later",
          person_id: "person-later",
        }),
      ],
      CUSTOMER_ID,
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.actor.membershipId).toBe("membership-earliest");
    expect(result.ok && result.actor.personId).toBe("person-earliest");
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
