"use client";

import { useId } from "react";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  resolveRoleDescription,
  resolveRoleLabel,
} from "@/lib/workspace/access/role-label";
import styles from "./role-checklist.module.css";

type RoleChecklistProps = {
  errorMessage?: string;
  hint?: string;
  inactiveTemplate: string;
  legend: string;
  onToggleAction: (roleId: string) => void;
  permissionsContent: SettingsPermissionsDictionary;
  roles: readonly RoleDto[];
  selectedRoleIds: readonly string[];
};

export function RoleChecklist({
  errorMessage,
  hint,
  inactiveTemplate,
  legend,
  onToggleAction,
  permissionsContent,
  roles,
  selectedRoleIds,
}: RoleChecklistProps) {
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const describedBy =
    [hint ? hintId : null, errorMessage ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      <ul className={styles.list}>
        {roles.map((role) => {
          const label = resolveRoleLabel(role, permissionsContent);
          const description = resolveRoleDescription(role, permissionsContent);
          const inputId = `${baseId}-${role.id}`;
          return (
            <li key={role.id}>
              <label
                className={styles.option}
                data-checked={
                  selectedRoleIds.includes(role.id) ? "true" : "false"
                }
                htmlFor={inputId}
              >
                <input
                  aria-describedby={describedBy}
                  checked={selectedRoleIds.includes(role.id)}
                  className={styles.checkbox}
                  id={inputId}
                  onChange={() => onToggleAction(role.id)}
                  type="checkbox"
                />
                <span className={styles.text}>
                  <span className={styles.label}>
                    {role.active
                      ? label
                      : formatMessage(inactiveTemplate, { role: label })}
                  </span>
                  {description ? (
                    <span className={styles.description}>{description}</span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {errorMessage ? (
        <p className={styles.error} id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
