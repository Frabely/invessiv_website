"use client";

import { useId, useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { selectAssignableRoles } from "@/common/patterns/access/role-selection";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import type {
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { AddMemberDialog } from "../add-member-dialog/add-member-dialog";
import { MemberRolesDialog } from "../member-roles-dialog/member-roles-dialog";
import { MemberRow } from "../member-row/member-row";
import { OwnerChangeDialog } from "../owner-change-dialog/owner-change-dialog";
import styles from "./members-list.module.css";

type MembersListProps = {
  content: SettingsMembersDictionary;
  currentMemberId: string;
  members: WorkspaceMemberDto[];
  permissionsContent: SettingsPermissionsDictionary;
  roles: RoleDto[];
};

export function MembersList({
  content,
  currentMemberId,
  members,
  permissionsContent,
  roles,
}: MembersListProps) {
  const headingId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [rolesMember, setRolesMember] = useState<WorkspaceMemberDto | null>(
    null,
  );
  const [ownerMember, setOwnerMember] = useState<WorkspaceMemberDto | null>(
    null,
  );

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
            content={content}
            isCurrentActor={member.id === currentMemberId}
            key={member.id}
            member={member}
            onEditRolesAction={() => setRolesMember(member)}
            onToggleOwnerAction={() => setOwnerMember(member)}
            permissionsContent={permissionsContent}
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
          content={content}
          member={rolesMember}
          onCloseAction={() => setRolesMember(null)}
          permissionsContent={permissionsContent}
          roles={roles}
        />
      ) : null}
      {ownerMember ? (
        <OwnerChangeDialog
          content={content}
          member={ownerMember}
          onCloseAction={() => setOwnerMember(null)}
        />
      ) : null}
    </section>
  );
}
