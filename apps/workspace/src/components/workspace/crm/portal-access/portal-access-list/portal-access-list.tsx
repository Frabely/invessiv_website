import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { portalRoleLabel } from "@/common/patterns/crm/portal-role-label";
import type { Locale } from "@/config/i18n";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { PortalInvitationRow } from "./portal-invitation-row";
import { PortalMembershipRow } from "./portal-membership-row";
import styles from "./portal-access-list.module.css";

export interface PortalAccessListProps {
  access: PortalAccessDto;
  content: CrmPortalAccessDictionary;
  locale: Locale;
  busyId: string | null;
  onReinvite: (assignmentId: string) => void;
  onRevokeInvitation: (invitationId: string) => void;
  onEditRoles: (membershipId: string) => void;
  onRevokeMembership: (membershipId: string) => void;
}

export function PortalAccessList({
  access,
  content,
  locale,
  busyId,
  onReinvite,
  onRevokeInvitation,
  onEditRoles,
  onRevokeMembership,
}: PortalAccessListProps) {
  const contactNames = new Map(
    access.contacts.map((contact) => [
      contact.assignmentId,
      contact.displayName,
    ]),
  );
  const roles = new Map(access.roles.map((role) => [role.id, role]));
  const roleNames = (ids: readonly string[]) =>
    ids
      .map((id) => roles.get(id))
      .filter((role) => role !== undefined)
      .map((role) => portalRoleLabel(role, content.portalStandard))
      .join(", ");

  return (
    <ul className={styles.list}>
      {access.invitations.map((invitation) => (
        <PortalInvitationRow
          key={invitation.id}
          invitation={invitation}
          contactName={contactNames.get(invitation.assignmentId) ?? ""}
          roleNames={roleNames(invitation.roleIds)}
          busy={busyId === invitation.id}
          content={content}
          locale={locale}
          onReinvite={() => onReinvite(invitation.assignmentId)}
          onRevoke={() => onRevokeInvitation(invitation.id)}
        />
      ))}
      {access.memberships.map((membership) => (
        <PortalMembershipRow
          key={membership.id}
          membership={membership}
          contactName={contactNames.get(membership.assignmentId) ?? ""}
          roleNames={roleNames(membership.roleIds)}
          content={content}
          locale={locale}
          onEditRoles={() => onEditRoles(membership.id)}
          onRevoke={() => onRevokeMembership(membership.id)}
        />
      ))}
    </ul>
  );
}
