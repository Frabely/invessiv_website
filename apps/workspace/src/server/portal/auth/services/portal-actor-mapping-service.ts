import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalActorRow } from "@invessiv/common/contracts/auth/rows/portal-actor-row";
import { isPermission } from "@invessiv/common/patterns/auth/can";
import { PortalActorResolutionError } from "@/common/constants/auth/portal-actor-resolution-errors";
import type { ResolvePortalActorResult } from "@/server/portal/auth/resolve-portal-actor-types";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

// Unknown keys and permissions of another realm are dropped instead of trusted.
function isPortalPermission(key: string | null): key is Permission {
  return (
    key !== null &&
    isPermission(key) &&
    PERMISSION_DEFINITIONS[key].realm === AuthRealm.Portal
  );
}

function mapRowsToResolution(
  rows: PortalActorRow[],
  customerId: string,
): ResolvePortalActorResult {
  const [first] = rows;

  if (!first) {
    return { ok: false, code: PortalActorResolutionError.UserMissing };
  }
  if (!first.user_active) {
    return { ok: false, code: PortalActorResolutionError.UserInactive };
  }
  const activeMembership = rows.find(
    (row) => row.membership_id !== null && row.revoked_at === null,
  );
  if (!activeMembership) {
    return { ok: false, code: PortalActorResolutionError.MembershipMissing };
  }

  // A user may hold two membership rows for the same customer via two different contact
  // assignments (one per `person_id`); only the resolved membership's own rows may contribute
  // permissions, or a revoked sibling membership's role could leak into this actor.
  const permissions = new Set(
    rows
      .filter((row) => row.membership_id === activeMembership.membership_id)
      .map((row) => row.permission_key)
      .filter(isPortalPermission),
  );
  if (!permissions.has(Permission.PortalAccess)) {
    return { ok: false, code: PortalActorResolutionError.AccessDenied };
  }

  return {
    ok: true,
    actor: createPortalActor({
      userId: activeMembership.user_id,
      membershipId: activeMembership.membership_id as string,
      customerId,
      personId: activeMembership.person_id as string,
      permissions,
      projectPermissions: new Map(),
    }),
  };
}

export const portalActorMappingService = { mapRowsToResolution } as const;
