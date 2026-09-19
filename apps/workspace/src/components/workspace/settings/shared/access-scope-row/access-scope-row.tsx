"use client";

import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import { ButtonControl, CheckboxControl } from "@invessiv/ui";
import type {
  SettingsAccessDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { resolveRoleLabel } from "@/lib/workspace/access/role-label";
import styles from "./access-scope-row.module.css";

export type AccessScopeRowRole = {
  role: RoleAssignmentOptionDto;
  checked: boolean;
  direct: boolean;
  disabled: boolean;
  inherited: boolean;
  pending: boolean;
  removeDirectDisabled: boolean;
};

export type AccessScopeRowProps = {
  accessContent: SettingsAccessDictionary;
  onToggleAction: (roleId: string, checked: boolean) => void;
  onRemoveDirectAction: (roleId: string) => void;
  permissionsContent: SettingsPermissionsDictionary;
  readOnly?: boolean;
  roles: readonly AccessScopeRowRole[];
  scopeLabel: string;
};

export function AccessScopeRow({
  accessContent,
  onRemoveDirectAction,
  onToggleAction,
  permissionsContent,
  readOnly = false,
  roles,
  scopeLabel,
}: AccessScopeRowProps) {
  return (
    <div className={styles.roles}>
      {roles.map(
        ({
          role,
          checked,
          direct,
          disabled,
          inherited,
          pending,
          removeDirectDisabled,
        }) => {
          const label = resolveRoleLabel(role, permissionsContent);
          const scopeLocked = role.scopeAssignable !== true;
          const hint =
            inherited && direct
              ? accessContent.directAndInherited
              : inherited
                ? accessContent.inherited
                : scopeLocked && !readOnly
                  ? accessContent.notAssignable
                  : readOnly
                    ? accessContent.readOnly
                    : null;
          return (
            <div
              className={styles.roleGroup}
              data-checked={checked ? "true" : "false"}
              data-locked={disabled || readOnly ? "true" : "false"}
              key={role.id}
            >
              <label className={styles.role}>
                <CheckboxControl
                  aria-label={formatMessage(accessContent.roleCheckboxLabel, {
                    role: label,
                    scope: scopeLabel,
                  })}
                  checked={checked}
                  disabled={disabled || readOnly || pending}
                  onChange={(event) =>
                    onToggleAction(role.id, event.target.checked)
                  }
                />
                <span className={styles.copy}>
                  <span className={styles.label}>
                    {role.active
                      ? label
                      : formatMessage(accessContent.inactiveRole, {
                          role: label,
                        })}
                  </span>
                  {hint ? <span className={styles.hint}>{hint}</span> : null}
                </span>
              </label>
              {direct && inherited && !readOnly ? (
                <ButtonControl
                  aria-label={formatMessage(accessContent.removeDirectLabel, {
                    role: label,
                    scope: scopeLabel,
                  })}
                  disabled={pending || removeDirectDisabled}
                  onClick={() => onRemoveDirectAction(role.id)}
                  type="button"
                  variant="ghost"
                >
                  {accessContent.removeDirect}
                </ButtonControl>
              ) : null}
            </div>
          );
        },
      )}
    </div>
  );
}
