import type { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  PERMISSION_GROUP_PERMISSIONS,
  PERMISSION_GROUP_VALUES,
} from "@/common/constants/access/permission-groups";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import styles from "./permission-summary.module.css";

type PermissionSummaryProps = {
  content: SettingsPermissionsDictionary;
  emptyLabel: string;
  permissions: readonly Permission[];
};

export function PermissionSummary({
  content,
  emptyLabel,
  permissions,
}: PermissionSummaryProps) {
  const groups = PERMISSION_GROUP_VALUES.map((group) => ({
    group,
    granted: PERMISSION_GROUP_PERMISSIONS[group].filter((permission) =>
      permissions.includes(permission),
    ),
  })).filter((entry) => entry.granted.length > 0);

  if (groups.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <dl className={styles.summary}>
      {groups.map(({ group, granted }) => (
        <div className={styles.row} key={group}>
          <dt className={styles.group}>{content.groups[group]}</dt>
          <dd className={styles.values}>
            <ul className={styles.list}>
              {granted.map((permission) => (
                <li className={styles.chip} key={permission}>
                  {content.permissions[permission].label}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}
