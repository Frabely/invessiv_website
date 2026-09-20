"use client";

import { useId, useRef, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { MemberRolesTab } from "@/common/constants/access/member-roles-tabs";
import { selectAssignableRoles } from "@/common/patterns/access/role-selection";
import { PrimaryCtaButton } from "@invessiv/ui";
import type {
  SettingsAccessDictionary,
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { AddMemberDialog } from "../add-member-dialog/add-member-dialog";
import { MemberRolesDialog } from "../member-roles-dialog/member-roles-dialog";
import { MemberRow } from "../member-row/member-row";
import { OwnerChangeDialog } from "../owner-change-dialog/owner-change-dialog";
import { MemberStatusDialog } from "../member-status-dialog/member-status-dialog";
import styles from "./members-list.module.css";

type MembersListProps = {
  accessContent: SettingsAccessDictionary;
  accessScopesByMember: Readonly<
    Record<string, readonly AccessScopeEntryDto[]>
  >;
  canManageAccess: boolean;
  content: SettingsMembersDictionary;
  currentMemberId: string;
  members: WorkspaceMemberDto[];
  permissionsContent: SettingsPermissionsDictionary;
  roles: RoleAssignmentOptionDto[];
  rolesHref: string;
  responsibilityWithoutAccessByMember?: Readonly<Record<string, number>>;
};

export function MembersList({
  accessContent,
  accessScopesByMember,
  canManageAccess,
  content,
  currentMemberId,
  members,
  permissionsContent,
  roles,
  rolesHref,
  responsibilityWithoutAccessByMember = {},
}: MembersListProps) {
  const headingId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [rolesMember, setRolesMember] = useState<WorkspaceMemberDto | null>(
    null,
  );
  const [rolesInitialTab, setRolesInitialTab] = useState<MemberRolesTab>(
    MemberRolesTab.Global,
  );
  const [ownerMember, setOwnerMember] = useState<WorkspaceMemberDto | null>(
    null,
  );
  const [statusMember, setStatusMember] = useState<WorkspaceMemberDto | null>(
    null,
  );
  const rolesTriggerRef = useRef<HTMLElement | null>(null);

  function openRolesDialog(member: WorkspaceMemberDto, tab: MemberRolesTab) {
    rolesTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setRolesInitialTab(tab);
    setRolesMember(member);
  }

  function closeRolesDialog() {
    setRolesMember(null);
    queueMicrotask(() => rolesTriggerRef.current?.focus());
  }

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.intro}>
          <h2 className={styles.heading} id={headingId}>
            {content.list.heading}
          </h2>
          <p className={styles.description}>{content.list.description}</p>
        </div>
        <PrimaryCtaButton
          className={styles.addButton}
          onClick={() => setIsAdding(true)}
          type="button"
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.buttonIcon}
            icon={faPlus}
          />
          <span>{content.list.addButton}</span>
        </PrimaryCtaButton>
      </div>

      <ul className={styles.list}>
        {members.map((member) => (
          <MemberRow
            canManageAccess={canManageAccess}
            content={content}
            isCurrentActor={member.id === currentMemberId}
            key={member.id}
            member={member}
            onManageRolesAction={() =>
              openRolesDialog(member, MemberRolesTab.Global)
            }
            onOpenAccessIssueAction={() =>
              openRolesDialog(member, MemberRolesTab.Customer)
            }
            onToggleOwnerAction={() => setOwnerMember(member)}
            onToggleStatusAction={() => setStatusMember(member)}
            permissionsContent={permissionsContent}
            responsibilityWithoutAccessCount={
              responsibilityWithoutAccessByMember[member.id] ?? 0
            }
          />
        ))}
      </ul>

      {isAdding ? (
        <AddMemberDialog
          content={content}
          onCloseAction={() => setIsAdding(false)}
          permissionsContent={permissionsContent}
          roles={selectAssignableRoles(roles, [])}
        />
      ) : null}
      {rolesMember ? (
        <MemberRolesDialog
          accessContent={accessContent}
          canManageAccess={canManageAccess}
          content={content}
          initialAccessScopes={accessScopesByMember[rolesMember.id] ?? []}
          initialTab={rolesInitialTab}
          member={rolesMember}
          onCloseAction={closeRolesDialog}
          permissionsContent={permissionsContent}
          roles={roles}
          rolesHref={rolesHref}
        />
      ) : null}
      {ownerMember ? (
        <OwnerChangeDialog
          content={content}
          member={ownerMember}
          onCloseAction={() => setOwnerMember(null)}
        />
      ) : null}
      {statusMember ? (
        <MemberStatusDialog
          content={content}
          member={statusMember}
          onCloseAction={() => setStatusMember(null)}
        />
      ) : null}
    </section>
  );
}
