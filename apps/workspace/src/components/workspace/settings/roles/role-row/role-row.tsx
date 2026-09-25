import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { ButtonControl } from "@invessiv/ui";
import type {
  SettingsPermissionsDictionary,
  SettingsRolesDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  resolveRoleDescription,
  resolveRoleLabel,
} from "@/lib/workspace/access/role-label";
import styles from "./role-row.module.css";

type RoleRowProps = {
  content: SettingsRolesDictionary;
  onOpenAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  role: RoleDto;
};

function formatCount(count: number, one: string, other: string): string {
  return count === 1 ? one : formatMessage(other, { count });
}

export function RoleRow({
  content,
  onOpenAction,
  permissionsContent,
  role,
}: RoleRowProps) {
  const label = resolveRoleLabel(role, permissionsContent);
  const description = resolveRoleDescription(role, permissionsContent);
  const actionLabel = role.isSystem
    ? content.list.viewButton
    : content.list.editButton;
  const memberCount =
    role.realm === AuthRealm.Portal
      ? role.assignedMemberCount === 0
        ? content.list.portalCountZero
        : formatCount(
            role.assignedMemberCount,
            content.list.portalCountOne,
            content.list.portalCountOther,
          )
      : role.assignedMemberCount === 0
        ? content.list.memberCountZero
        : formatCount(
            role.assignedMemberCount,
            content.list.memberCountOne,
            content.list.memberCountOther,
          );

  return (
    <li className={styles.row} data-active={role.active ? "true" : "false"}>
      <div className={styles.identity}>
        <p className={styles.nameLine}>
          <span className={styles.name}>{label}</span>
          {role.isSystem ? (
            <span className={styles.typeBadge}>
              {content.list.systemRoleType}
            </span>
          ) : null}
          <span className={styles.typeBadge}>
            {role.realm === AuthRealm.Portal
              ? content.dialog.portalRoleType
              : role.scopeAssignable
                ? content.list.customerRoleType
                : content.list.globalType}
          </span>
          {role.active ? null : (
            <span className={styles.inactiveBadge}>
              {content.list.inactiveBadge}
            </span>
          )}
        </p>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      <p className={styles.meta}>
        <span>
          {formatCount(
            role.permissions.length,
            content.list.permissionCountOne,
            content.list.permissionCountOther,
          )}
        </span>
        <span>{memberCount}</span>
      </p>
      <ButtonControl
        aria-label={`${actionLabel}: ${label}`}
        className={styles.actionButton}
        onClick={onOpenAction}
        type="button"
        variant="ghost"
      >
        {actionLabel}
      </ButtonControl>
    </li>
  );
}
