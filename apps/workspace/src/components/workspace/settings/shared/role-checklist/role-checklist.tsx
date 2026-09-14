"use client";

import { useId } from "react";

import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import { CheckboxControl } from "@invessiv/ui";
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
  roles: readonly RoleAssignmentOptionDto[];
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
                <CheckboxControl
                  aria-describedby={describedBy}
                  checked={selectedRoleIds.includes(role.id)}
                  id={inputId}
                  onChange={() => onToggleAction(role.id)}
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
