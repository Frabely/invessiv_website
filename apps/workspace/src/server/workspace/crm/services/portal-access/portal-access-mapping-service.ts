import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import type { PortalInvitationDto } from "@invessiv/common/contracts/crm/portal-invitation.dto";
import type { PortalMembershipDto } from "@invessiv/common/contracts/crm/portal-membership.dto";
import type { PortalRoleDto } from "@invessiv/common/contracts/crm/portal-role.dto";
import type { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";

type ContactRow = { id: string; displayName: string };
type RoleRow = {
  id: string;
  name: string;
  systemKey: SystemRoleKey | null;
  active: boolean;
  permission: string | null;
};
type InvitationRow = {
  id: string;
  assignmentId: string;
  expiresAt: Date;
  createdAt: Date;
  roleId: string | null;
};
type MembershipRow = {
  id: string;
  assignmentId: string;
  version: number;
  activatedAt: Date;
  lastSeenAt: Date | null;
  emailNotificationsEnabled: boolean;
  roleId: string | null;
};

/**
 * Every join here repeats the same shape: several flat rows share one id, and each row
 * contributes at most one value to a one-to-many field on that id's DTO. `seed` builds the DTO
 * from the row that first introduces the id; `collect` folds every row (including that first one)
 * into it.
 */
function groupRowsById<TRow extends { id: string }, TItem>(
  rows: readonly TRow[],
  seed: (row: TRow) => TItem,
  collect: (item: TItem, row: TRow) => void,
): TItem[] {
  const byId = new Map<string, TItem>();
  for (const row of rows) {
    const item = byId.get(row.id) ?? seed(row);
    collect(item, row);
    byId.set(row.id, item);
  }
  return [...byId.values()];
}

function mapRoles(rows: readonly RoleRow[]): PortalRoleDto[] {
  return groupRowsById(
    rows,
    (row): PortalRoleDto => ({
      id: row.id,
      name: row.name,
      systemKey: row.systemKey,
      active: row.active,
      permissions: [],
    }),
    (role, row) => {
      if (row.permission) role.permissions.push(row.permission);
    },
  );
}

function mapInvitations(
  rows: readonly InvitationRow[],
  asOf: Date,
): PortalInvitationDto[] {
  return groupRowsById(
    rows,
    (row): PortalInvitationDto => ({
      id: row.id,
      assignmentId: row.assignmentId,
      roleIds: [],
      expiresAt: row.expiresAt.toISOString(),
      expired: row.expiresAt.getTime() <= asOf.getTime(),
      createdAt: row.createdAt.toISOString(),
    }),
    (item, row) => {
      if (row.roleId) item.roleIds.push(row.roleId);
    },
  );
}

function mapMemberships(rows: readonly MembershipRow[]): PortalMembershipDto[] {
  return groupRowsById(
    rows,
    (row): PortalMembershipDto => ({
      id: row.id,
      assignmentId: row.assignmentId,
      version: row.version,
      roleIds: [],
      activatedAt: row.activatedAt.toISOString(),
      lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
      emailNotificationsEnabled: row.emailNotificationsEnabled,
    }),
    (item, row) => {
      if (row.roleId) item.roleIds.push(row.roleId);
    },
  );
}

function mapRowsToDto(input: {
  customerId: string;
  customerVersion: number;
  previewConfirmedAt: Date | null;
  contacts: readonly ContactRow[];
  roles: readonly RoleRow[];
  invitations: readonly InvitationRow[];
  memberships: readonly MembershipRow[];
  asOf: Date;
}): PortalAccessDto {
  return {
    customerId: input.customerId,
    customerVersion: input.customerVersion,
    previewConfirmedAt: input.previewConfirmedAt?.toISOString() ?? null,
    contacts: input.contacts.map((row) => ({
      assignmentId: row.id,
      displayName: row.displayName,
    })),
    roles: mapRoles(input.roles),
    invitations: mapInvitations(input.invitations, input.asOf),
    memberships: mapMemberships(input.memberships),
  };
}

export const portalAccessMappingService = { mapRowsToDto } as const;
