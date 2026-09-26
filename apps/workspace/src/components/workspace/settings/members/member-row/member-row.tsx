import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { faUserCheck, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import type {
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
import { resolveRoleLabel } from "@/lib/workspace/access/role-label";
import styles from "./member-row.module.css";

type MemberRowProps = {
  canManageAccess: boolean;
  content: SettingsMembersDictionary;
  isCurrentActor: boolean;
  member: WorkspaceMemberDto;
  onManageRolesAction: () => void;
  onOpenAccessIssueAction: () => void;
  onToggleOwnerAction: () => void;
  onToggleStatusAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  responsibilityWithoutAccessCount?: number;
};

export function MemberRow({
  canManageAccess,
  content,
  isCurrentActor,
  member,
  onManageRolesAction,
  onOpenAccessIssueAction,
  onToggleOwnerAction,
  onToggleStatusAction,
  permissionsContent,
  responsibilityWithoutAccessCount = 0,
}: MemberRowProps) {
  const ownerActionLabel = member.isOwner
    ? content.list.actions.revokeOwner
    : content.list.actions.grantOwner;
  const canChangeOwner = member.isOwner || member.active;

  return (
    <li className={styles.row} data-active={member.active ? "true" : "false"}>
      <span aria-hidden="true" className={styles.avatar}>
        {getMemberInitials(member.displayName)}
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
      {canManageAccess ? (
        <div className={styles.accessSummary}>
          <p className={styles.accessCount}>
            {member.accessScopeCount === 0
              ? content.list.accessCountZero
              : formatMessage(
                  member.accessScopeCount === 1
                    ? content.list.accessCountOne
                    : content.list.accessCountOther,
                  { count: member.accessScopeCount },
                )}
          </p>
          {responsibilityWithoutAccessCount > 0 ? (
            <button
              className={styles.responsibilityIssue}
              onClick={onOpenAccessIssueAction}
              type="button"
            >
              {formatMessage(
                responsibilityWithoutAccessCount === 1
                  ? content.list.responsibilityWithoutAccessOne
                  : content.list.responsibilityWithoutAccessOther,
                { count: responsibilityWithoutAccessCount },
              )}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className={styles.actions}>
        <ButtonControl
          aria-label={`${content.list.actions.manageRoles}: ${member.displayName}`}
          className={styles.actionButton}
          onClick={onManageRolesAction}
          type="button"
          variant="ghost"
        >
          {content.list.actions.manageRoles}
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
