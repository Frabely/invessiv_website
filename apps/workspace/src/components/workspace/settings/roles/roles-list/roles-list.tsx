"use client";

import { useState } from "react";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { EmptyState, PrimaryCtaButton } from "@invessiv/ui";
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
  const [realm, setRealm] = useState<AuthRealm>(AuthRealm.Workspace);
  const visibleRoles = roles.filter((role) => role.realm === realm);
  const systemRoles = visibleRoles.filter((role) => role.isSystem);
  const customRoles = visibleRoles.filter((role) => !role.isSystem);

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
      <div
        className={styles.realmSwitch}
        role="group"
        aria-label={content.dialog.roleTypeLabel}
      >
        <button
          type="button"
          aria-pressed={realm === AuthRealm.Workspace}
          className={styles.realmButton}
          onClick={() => {
            closeDialog();
            setRealm(AuthRealm.Workspace);
          }}
        >
          {content.list.workspaceRealm}
        </button>
        <button
          type="button"
          aria-pressed={realm === AuthRealm.Portal}
          className={styles.realmButton}
          onClick={() => {
            closeDialog();
            setRealm(AuthRealm.Portal);
          }}
        >
          {content.list.portalRealm}
        </button>
      </div>
      {realm === AuthRealm.Portal ? (
        <p className={styles.description}>{content.list.portalIntro}</p>
      ) : null}
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
          <EmptyState
            action={createButton}
            alignment="start"
            description={content.list.emptyDescription}
            icon={<FontAwesomeIcon icon={faPlus} />}
            title={content.list.emptyTitle}
          />
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
          realm={realm}
          role={openRole}
        />
      ) : null}
    </div>
  );
}
