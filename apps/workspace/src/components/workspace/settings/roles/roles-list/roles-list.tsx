"use client";

import { useState } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { PrimaryCtaButton } from "@invessiv/ui";
import type {
  SettingsPermissionsDictionary,
  SettingsRolesDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { RoleFormDialog } from "../role-form-dialog/role-form-dialog";
import { RoleRow } from "../role-row/role-row";
import styles from "./roles-list.module.css";

type RolesListProps = {
  content: SettingsRolesDictionary;
  permissionsContent: SettingsPermissionsDictionary;
  roles: RoleDto[];
};

const CUSTOM_ROLES_HEADING_ID = "settings-custom-roles-heading";
const SYSTEM_ROLES_HEADING_ID = "settings-system-roles-heading";

export function RolesList({
  content,
  permissionsContent,
  roles,
}: RolesListProps) {
  const [openRole, setOpenRole] = useState<RoleDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const systemRoles = roles.filter((role) => role.isSystem);
  const customRoles = roles.filter((role) => !role.isSystem);

  const createButton = (
    <PrimaryCtaButton
      className={styles.createButton}
      onClick={() => setIsCreating(true)}
      type="button"
    >
      <FontAwesomeIcon
        aria-hidden="true"
        className={styles.buttonIcon}
        icon={faPlus}
      />
      <span>{content.list.createButton}</span>
    </PrimaryCtaButton>
  );

  function closeDialog() {
    setOpenRole(null);
    setIsCreating(false);
  }

  return (
    <div className={styles.stack}>
      <section
        aria-labelledby={CUSTOM_ROLES_HEADING_ID}
        className={styles.section}
      >
        <div className={styles.sectionHeader}>
          <div className={styles.intro}>
            <h2 className={styles.heading} id={CUSTOM_ROLES_HEADING_ID}>
              {content.list.customHeading}
            </h2>
            <p className={styles.description}>
              {content.list.customDescription}
            </p>
          </div>
          {customRoles.length > 0 ? createButton : null}
        </div>
        {customRoles.length > 0 ? (
          <ul className={styles.list}>
            {customRoles.map((role) => (
              <RoleRow
                content={content}
                key={role.id}
                onOpenAction={() => setOpenRole(role)}
                permissionsContent={permissionsContent}
                role={role}
              />
            ))}
          </ul>
        ) : (
          <div className={styles.emptyPanel}>
            <h3 className={styles.emptyTitle}>{content.list.emptyTitle}</h3>
            <p className={styles.emptyDescription}>
              {content.list.emptyDescription}
            </p>
            <div className={styles.emptyAction}>{createButton}</div>
          </div>
        )}
      </section>

      <section
        aria-labelledby={SYSTEM_ROLES_HEADING_ID}
        className={styles.section}
      >
        <div className={styles.intro}>
          <h2 className={styles.heading} id={SYSTEM_ROLES_HEADING_ID}>
            {content.list.systemHeading}
          </h2>
          <p className={styles.description}>{content.list.systemDescription}</p>
        </div>
        <ul className={styles.list}>
          {systemRoles.map((role) => (
            <RoleRow
              content={content}
              key={role.id}
              onOpenAction={() => setOpenRole(role)}
              permissionsContent={permissionsContent}
              role={role}
            />
          ))}
        </ul>
      </section>

      {isCreating || openRole ? (
        <RoleFormDialog
          content={content}
          onCloseAction={closeDialog}
          permissionsContent={permissionsContent}
          role={openRole}
        />
      ) : null}
    </div>
  );
}
