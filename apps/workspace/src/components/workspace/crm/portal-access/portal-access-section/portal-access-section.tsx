"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { portalAccessApiService } from "@/client/crm/portal-access-api-service";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { Locale } from "@/config/i18n";
import { formatMessage } from "@/lib/i18n/format-message";
import { portalRoleLabel } from "@/common/patterns/crm/portal-role-label";
import { portalAccessErrorMessage } from "@/common/patterns/crm/portal-access-error-message";
import { PortalInviteDialog } from "../invite-portal-contact-dialog/invite-portal-contact-dialog";
import { PortalMembershipRolesDialog } from "../portal-membership-roles-dialog/portal-membership-roles-dialog";
import styles from "./portal-access-section.module.css";

export interface PortalAccessSectionProps {
  access: PortalAccessDto;
  content: CrmPortalAccessDictionary;
  locale: Locale;
}

function InvitationRow({
  invitation,
  contactName,
  roleNames,
  busy,
  content,
  locale,
  onReinvite,
  onRevoke,
}: {
  invitation: PortalAccessDto["invitations"][number];
  contactName: string;
  roleNames: string;
  busy: boolean;
  content: CrmPortalAccessDictionary;
  locale: Locale;
  onReinvite: () => void;
  onRevoke: () => void;
}) {
  return (
    <li className={styles.row}>
      <div>
        <strong>{contactName}</strong>
        <p className={styles.status}>
          {invitation.expired ? content.expired : content.pending}
        </p>
        <p>{roleNames}</p>
        <p>
          {formatMessage(content.expires, {
            date: new Date(invitation.expiresAt).toLocaleDateString(locale),
          })}
        </p>
      </div>
      <div className={styles.actions}>
        <ButtonControl type="button" onClick={onReinvite}>
          {content.reinvite}
        </ButtonControl>
        <ButtonControl
          type="button"
          disabled={busy}
          onClick={onRevoke}
          variant="ghost"
        >
          {content.revokeInvitation}
        </ButtonControl>
      </div>
    </li>
  );
}

function MembershipRow({
  membership,
  contactName,
  roleNames,
  content,
  locale,
  onEditRoles,
  onRevoke,
}: {
  membership: PortalAccessDto["memberships"][number];
  contactName: string;
  roleNames: string;
  content: CrmPortalAccessDictionary;
  locale: Locale;
  onEditRoles: () => void;
  onRevoke: () => void;
}) {
  const lastSeen = membership.lastSeenAt
    ? formatMessage(content.lastSeen, {
        date: new Date(membership.lastSeenAt).toLocaleDateString(locale),
      })
    : content.neverSeen;
  return (
    <li className={styles.row}>
      <div>
        <strong>{contactName}</strong>
        <p className={styles.status}>{content.active}</p>
        <p>{roleNames}</p>
        <p>{lastSeen}</p>
      </div>
      <div className={styles.actions}>
        <ButtonControl type="button" onClick={onEditRoles}>
          {content.roles}
        </ButtonControl>
        <ButtonControl type="button" onClick={onRevoke} variant="ghost">
          {content.revoke}
        </ButtonControl>
      </div>
    </li>
  );
}

function RevokeMembershipDialog({
  content,
  busy,
  onClose,
  onConfirm,
}: {
  content: CrmPortalAccessDictionary;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      closeLabel={content.dialog.close}
      title={content.dialog.revokeTitle}
      description={content.dialog.revokeHint}
      onCloseAction={onClose}
      size={DialogSize.Narrow}
      footer={
        <>
          <ButtonControl type="button" variant="ghost" onClick={onClose}>
            {content.dialog.cancel}
          </ButtonControl>
          <ButtonControl type="button" disabled={busy} onClick={onConfirm}>
            {content.dialog.revokeConfirm}
          </ButtonControl>
        </>
      }
    >
      <p>{content.dialog.revokeHint}</p>
    </Dialog>
  );
}

export function PortalAccessSection({
  access,
  content,
  locale,
}: PortalAccessSectionProps) {
  const router = useRouter();
  const [inviteAssignmentId, setInviteAssignmentId] = useState<string | null>(
    null,
  );
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(
    null,
  );
  const [revokeMembershipId, setRevokeMembershipId] = useState<string | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contactName = (assignmentId: string) =>
    access.contacts.find((contact) => contact.assignmentId === assignmentId)
      ?.displayName ?? "";
  const roleNames = (roleIds: readonly string[]) =>
    roleIds
      .map((id) => {
        const role = access.roles.find((item) => item.id === id);
        return role ? portalRoleLabel(role, content.portalStandard) : undefined;
      })
      .filter(Boolean)
      .join(", ");

  async function revokeInvitation(id: string) {
    setBusyId(id);
    setError(null);
    const result = await portalAccessApiService.revokeInvitation(id);
    setBusyId(null);
    if (!result.ok) {
      setError(portalAccessErrorMessage(result.code, content));
      return;
    }
    router.refresh();
  }

  async function revokeMembership(id: string) {
    setBusyId(id);
    setError(null);
    const result = await portalAccessApiService.revokeMembership(id);
    setBusyId(null);
    setRevokeMembershipId(null);
    if (!result.ok) {
      setError(portalAccessErrorMessage(result.code, content));
      return;
    }
    router.refresh();
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="crm-portal-access-title"
    >
      <div className={styles.header}>
        <div>
          <h3 id="crm-portal-access-title">{content.title}</h3>
          <p>{content.intro}</p>
        </div>
        <ButtonControl type="button" onClick={() => setInviteAssignmentId("")}>
          {content.invite}
        </ButtonControl>
      </div>
      {access.invitations.length === 0 && access.memberships.length === 0 ? (
        <p className={styles.empty}>{content.empty}</p>
      ) : (
        <ul className={styles.list}>
          {access.invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              contactName={contactName(invitation.assignmentId)}
              roleNames={roleNames(invitation.roleIds)}
              busy={busyId === invitation.id}
              content={content}
              locale={locale}
              onReinvite={() => setInviteAssignmentId(invitation.assignmentId)}
              onRevoke={() => void revokeInvitation(invitation.id)}
            />
          ))}
          {access.memberships.map((membership) => (
            <MembershipRow
              key={membership.id}
              membership={membership}
              contactName={contactName(membership.assignmentId)}
              roleNames={roleNames(membership.roleIds)}
              content={content}
              locale={locale}
              onEditRoles={() => setEditingMembershipId(membership.id)}
              onRevoke={() => setRevokeMembershipId(membership.id)}
            />
          ))}
        </ul>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {inviteAssignmentId !== null ? (
        <PortalInviteDialog
          access={access}
          content={content}
          locale={locale}
          initialAssignmentId={inviteAssignmentId}
          onCloseAction={() => setInviteAssignmentId(null)}
        />
      ) : null}
      {editingMembershipId !== null ? (
        <PortalMembershipRolesDialog
          membership={access.memberships.find(
            (item) => item.id === editingMembershipId,
          )!}
          roles={access.roles}
          content={content}
          onCloseAction={() => setEditingMembershipId(null)}
        />
      ) : null}
      {revokeMembershipId !== null ? (
        <RevokeMembershipDialog
          content={content}
          busy={busyId === revokeMembershipId}
          onClose={() => setRevokeMembershipId(null)}
          onConfirm={() => void revokeMembership(revokeMembershipId)}
        />
      ) : null}
    </section>
  );
}
