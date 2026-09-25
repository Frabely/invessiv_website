import { describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalActorRow } from "@invessiv/common/contracts/auth/rows/portal-actor-row";
import { PortalActorResolutionError } from "@/common/constants/auth/portal-actor-resolution-errors";
import { portalActorMappingService } from "@/server/portal/auth/services/portal-actor-mapping-service";

vi.mock("server-only", () => ({}));

const CUSTOMER_ID = "customer-a";

function row(overrides: Partial<PortalActorRow> = {}): PortalActorRow {
  return {
    user_id: "user-a",
    user_active: true,
    membership_id: "membership-a",
    person_id: "person-a",
    revoked_at: null,
    permission_key: Permission.PortalAccess,
    ...overrides,
  };
}

describe("portalActorMappingService.mapRowsToResolution", () => {
  it("rejects when no user row exists", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [],
      CUSTOMER_ID,
    );
    expect(result).toEqual({
      ok: false,
      code: PortalActorResolutionError.UserMissing,
    });
  });

  it("rejects an inactive user before looking at memberships", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [row({ user_active: false, membership_id: null, permission_key: null })],
      CUSTOMER_ID,
    );
    expect(result).toEqual({
      ok: false,
      code: PortalActorResolutionError.UserInactive,
    });
  });

  it("rejects when the user has no active membership for this customer", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [row({ membership_id: null, person_id: null, permission_key: null })],
      CUSTOMER_ID,
    );
    expect(result).toEqual({
      ok: false,
      code: PortalActorResolutionError.MembershipMissing,
    });
  });

  it("ignores a revoked membership row and resolves the next active one", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({
          membership_id: "membership-revoked",
          revoked_at: new Date("2026-01-01"),
          permission_key: null,
        }),
        row({ membership_id: "membership-active" }),
      ],
      CUSTOMER_ID,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.membershipId).toBe("membership-active");
    }
  });

  it("rejects a membership whose only permission is from another realm", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [row({ permission_key: Permission.PortalAccessManage })],
      CUSTOMER_ID,
    );
    expect(result).toEqual({
      ok: false,
      code: PortalActorResolutionError.AccessDenied,
    });
  });

  it("builds the actor from the resolved membership", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [row({ permission_key: Permission.PortalAccess })],
      CUSTOMER_ID,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.membershipId).toBe("membership-a");
      expect(result.actor.customerId).toBe(CUSTOMER_ID);
      expect(result.actor.personId).toBe("person-a");
      expect([...result.actor.permissions]).toEqual([Permission.PortalAccess]);
    }
  });

  it("never lets a revoked sibling membership's rows into the resolved actor's permissions", () => {
    const result = portalActorMappingService.mapRowsToResolution(
      [
        row({ permission_key: Permission.PortalAccess }),
        row({
          membership_id: "membership-revoked",
          revoked_at: new Date("2026-01-01"),
          permission_key: null,
        }),
      ],
      CUSTOMER_ID,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.membershipId).toBe("membership-a");
      expect([...result.actor.permissions]).toEqual([Permission.PortalAccess]);
    }
  });

  it("picks the first row's membership deterministically when two are active for this customer", () => {
    // Whether this is the right membership depends on the query ordering by activation date
    // before the rows ever reach this function — this only pins that the mapper itself always
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
    if (result.ok) {
      expect(result.actor.membershipId).toBe("membership-earliest");
      expect(result.actor.personId).toBe("person-earliest");
    }
  });
});
