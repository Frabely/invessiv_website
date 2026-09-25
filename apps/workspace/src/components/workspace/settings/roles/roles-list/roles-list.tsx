"use client";

import { useState } from "react";
import {
  AUTH_REALM_VALUES,
  AuthRealm,
} from "@invessiv/common/constants/auth/auth-realms";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { ButtonControl, EmptyState, PrimaryCtaButton } from "@invessiv/ui";
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
const ROLE_LIST_REALM_CONFIG: Record<
  AuthRealm,
  {
    labelKey: "workspaceRealm" | "portalRealm";
    introKey: "portalIntro" | null;
  }
> = {
  [AuthRealm.Workspace]: { labelKey: "workspaceRealm", introKey: null },
  [AuthRealm.Portal]: { labelKey: "portalRealm", introKey: "portalIntro" },
};

export function RolesList({
  content,
  permissionsContent,
  roles,
}: RolesListProps) {
  const [openRole, setOpenRole] = useState<RoleDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [realm, setRealm] = useState<AuthRealm>(AuthRealm.Workspace);
  const realmSwitchOptions = AUTH_REALM_VALUES.map((optionRealm) => ({
    realm: optionRealm,
    label: content.list[ROLE_LIST_REALM_CONFIG[optionRealm].labelKey],
  }));
  const introKey = ROLE_LIST_REALM_CONFIG[realm].introKey;
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
        {realmSwitchOptions.map((option) => (
          <ButtonControl
            key={option.realm}
            type="button"
            aria-pressed={realm === option.realm}
            className={styles.realmButton}
            onClick={() => {
              closeDialog();
              setRealm(option.realm);
            }}
          >
            {option.label}
          </ButtonControl>
        ))}
      </div>
      {introKey ? (
        <p className={styles.description}>{content.list[introKey]}</p>
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
