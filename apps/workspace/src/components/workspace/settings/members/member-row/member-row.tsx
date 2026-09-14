import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { faUserCheck, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import type {
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { resolveRoleLabel } from "@/lib/workspace/access/role-label";
import styles from "./member-row.module.css";

type MemberRowProps = {
  content: SettingsMembersDictionary;
  isCurrentActor: boolean;
  member: WorkspaceMemberDto;
  onEditRolesAction: () => void;
  onToggleOwnerAction: () => void;
  onToggleStatusAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
};

function getInitials(displayName: string): string {
  const letters = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function MemberRow({
  content,
  isCurrentActor,
  member,
  onEditRolesAction,
  onToggleOwnerAction,
  onToggleStatusAction,
  permissionsContent,
}: MemberRowProps) {
  const ownerActionLabel = member.isOwner
    ? content.list.actions.revokeOwner
    : content.list.actions.grantOwner;
  const canChangeOwner = member.isOwner || member.active;

  return (
    <li className={styles.row} data-active={member.active ? "true" : "false"}>
      <span aria-hidden="true" className={styles.avatar}>
        {getInitials(member.displayName)}
      </span>
      <div className={styles.identity}>
        <p className={styles.nameLine}>
          <span className={styles.name}>{member.displayName}</span>
          {isCurrentActor ? (
            <span className={styles.selfBadge}>
              {content.list.currentUserBadge}
            </span>
          ) : null}
          {member.isOwner ? (
            <span className={styles.ownerBadge}>{content.list.ownerBadge}</span>
          ) : null}
          <span
            className={styles.statusBadge}
            data-active={member.active ? "true" : "false"}
          >
            {member.active
              ? content.list.activeBadge
              : content.list.inactiveBadge}
          </span>
        </p>
        <p className={styles.email}>{member.primaryEmail}</p>
        {member.hasActiveRole ? null : (
          <p className={styles.noActiveRole}>{content.list.noActiveRole}</p>
        )}
      </div>
      <ul aria-label={content.rolesDialog.rolesLabel} className={styles.roles}>
        {member.roles.length > 0 ? (
          member.roles.map((role) => {
            const label = resolveRoleLabel(role, permissionsContent);
            return (
              <li
                className={styles.roleChip}
                data-active={role.active ? "true" : "false"}
                key={role.id}
              >
                {role.active
                  ? label
                  : formatMessage(content.list.inactiveRole, { role: label })}
              </li>
            );
          })
        ) : (
          <li className={styles.noRoles}>{content.list.noRoles}</li>
        )}
      </ul>
      <div className={styles.actions}>
        <ButtonControl
          aria-label={`${content.list.actions.editRoles}: ${member.displayName}`}
          className={styles.actionButton}
          onClick={onEditRolesAction}
          type="button"
          variant="ghost"
        >
          {content.list.actions.editRoles}
        </ButtonControl>
        {isCurrentActor ? null : (
          <>
            {canChangeOwner ? (
              <ButtonControl
                aria-label={`${ownerActionLabel}: ${member.displayName}`}
                className={styles.actionButton}
                onClick={onToggleOwnerAction}
                type="button"
                variant="ghost"
              >
                {ownerActionLabel}
              </ButtonControl>
            ) : null}
            <ButtonControl
              aria-label={`${member.active ? content.list.actions.deactivate : content.list.actions.activate}: ${member.displayName}`}
              className={styles.actionButton}
              onClick={onToggleStatusAction}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.actionIcon}
                icon={member.active ? faUserSlash : faUserCheck}
              />
              {member.active
                ? content.list.actions.deactivate
                : content.list.actions.activate}
            </ButtonControl>
          </>
        )}
      </div>
    </li>
  );
}
