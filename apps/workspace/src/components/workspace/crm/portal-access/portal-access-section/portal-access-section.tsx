"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { portalAccessApiService } from "@/client/crm/portal-access-api-service";
import { portalAccessErrorMessage } from "@/common/patterns/crm/portal-access-error-message";
import type { Locale } from "@/config/i18n";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { SectionCollapseToggle } from "@/components/workspace/crm/shared/section-collapse-toggle/section-collapse-toggle";
import { PortalInviteDialog } from "../invite-portal-contact-dialog/invite-portal-contact-dialog";
import { PortalAccessList } from "../portal-access-list/portal-access-list";
import { PortalMembershipRolesDialog } from "../portal-membership-roles-dialog/portal-membership-roles-dialog";
import { RevokePortalMembershipDialog } from "../revoke-portal-membership-dialog/revoke-portal-membership-dialog";
import styles from "./portal-access-section.module.css";

export interface PortalAccessSectionProps {
  access: PortalAccessDto;
  content: CrmPortalAccessDictionary;
  permissionsContent: SettingsPermissionsDictionary;
  locale: Locale;
}

export function PortalAccessSection({
  access,
  content,
  permissionsContent,
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
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const editingMembership = access.memberships.find(
    (item) => item.id === editingMembershipId,
  );

  async function revokeInvitation(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await portalAccessApiService.revokeInvitation(id);
      if (!result.ok) {
        setError(portalAccessErrorMessage(result.code, content));
        return;
      }
      router.refresh();
    } catch {
      setError(content.errors.unavailable);
    } finally {
      setBusyId(null);
    }
  }

  async function revokeMembership(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await portalAccessApiService.revokeMembership(id);
      if (!result.ok) {
        setError(portalAccessErrorMessage(result.code, content));
        return;
      }
      setRevokeMembershipId(null);
      router.refresh();
    } catch {
      setError(content.errors.unavailable);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="crm-portal-access-title"
    >
      <div className={styles.header}>
        <h3 id="crm-portal-access-title">{content.title}</h3>
        <div className={styles.headMeta}>
          <ButtonControl
            className={styles.actionButton}
            type="button"
            onClick={() => setInviteAssignmentId("")}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faUserPlus} />
            {content.invite}
          </ButtonControl>
          <SectionCollapseToggle
            controls={bodyId}
            expanded={expanded}
            labelCollapse={content.collapseLabel}
            labelExpand={content.expandLabel}
            onToggleAction={() => setExpanded((current) => !current)}
          />
        </div>
      </div>
      {expanded ? (
        <div className={styles.body} id={bodyId}>
          <p className={styles.intro}>{content.intro}</p>
          {access.invitations.length === 0 &&
          access.memberships.length === 0 ? (
            <p className={styles.empty}>{content.empty}</p>
          ) : (
            <PortalAccessList
              access={access}
              content={content}
              permissionsContent={permissionsContent}
              locale={locale}
              busyId={busyId}
              onReinvite={setInviteAssignmentId}
              onRevokeInvitation={(id) => void revokeInvitation(id)}
              onEditRoles={setEditingMembershipId}
              onRevokeMembership={setRevokeMembershipId}
            />
          )}
        </div>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      {inviteAssignmentId !== null ? (
        <PortalInviteDialog
          access={access}
          content={content}
          permissionsContent={permissionsContent}
          locale={locale}
          initialAssignmentId={inviteAssignmentId}
          onCloseAction={() => setInviteAssignmentId(null)}
        />
      ) : null}
      {editingMembership ? (
        <PortalMembershipRolesDialog
          membership={editingMembership}
          roles={access.roles}
          content={content}
          permissionsContent={permissionsContent}
          onCloseAction={() => setEditingMembershipId(null)}
        />
      ) : null}
      {revokeMembershipId !== null ? (
        <RevokePortalMembershipDialog
          content={content}
          busy={busyId === revokeMembershipId}
          onClose={() => setRevokeMembershipId(null)}
          onConfirm={() => void revokeMembership(revokeMembershipId)}
        />
      ) : null}
    </section>
  );
}
