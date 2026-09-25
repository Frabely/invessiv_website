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

function mapRoles(rows: readonly RoleRow[]): PortalRoleDto[] {
  const rolesById = new Map<string, PortalRoleDto>();
  for (const row of rows) {
    const role = rolesById.get(row.id) ?? {
      id: row.id,
      name: row.name,
      systemKey: row.systemKey,
      active: row.active,
      permissions: [],
    };
    if (row.permission) role.permissions.push(row.permission);
    rolesById.set(row.id, role);
  }
  return [...rolesById.values()];
}

function mapInvitations(
  rows: readonly InvitationRow[],
  asOf: Date,
): PortalInvitationDto[] {
  const invitationsById = new Map<string, PortalInvitationDto>();
  for (const row of rows) {
    const item = invitationsById.get(row.id) ?? {
      id: row.id,
      assignmentId: row.assignmentId,
      roleIds: [],
      expiresAt: row.expiresAt.toISOString(),
      expired: row.expiresAt.getTime() <= asOf.getTime(),
      createdAt: row.createdAt.toISOString(),
    };
    if (row.roleId) item.roleIds.push(row.roleId);
    invitationsById.set(row.id, item);
  }
  return [...invitationsById.values()];
}

function mapMemberships(rows: readonly MembershipRow[]): PortalMembershipDto[] {
  const membershipsById = new Map<string, PortalMembershipDto>();
  for (const row of rows) {
    const item = membershipsById.get(row.id) ?? {
      id: row.id,
      assignmentId: row.assignmentId,
      version: row.version,
      roleIds: [],
      activatedAt: row.activatedAt.toISOString(),
      lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
      emailNotificationsEnabled: row.emailNotificationsEnabled,
    };
    if (row.roleId) item.roleIds.push(row.roleId);
    membershipsById.set(row.id, item);
  }
  return [...membershipsById.values()];
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
