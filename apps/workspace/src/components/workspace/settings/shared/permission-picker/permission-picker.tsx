"use client";

import { useId } from "react";

import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { CheckboxControl } from "@invessiv/ui";
import {
  PERMISSION_GROUP_PERMISSIONS,
  PERMISSION_GROUP_VALUES,
} from "@/common/constants/access/permission-groups";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import styles from "./permission-picker.module.css";

type PermissionPickerProps = {
  content: SettingsPermissionsDictionary;
  legend: string;
  /** Custom roles cannot hold non-delegable permissions; they stay visible but locked. */
  lockNonDelegable: boolean;
  /** Scoped roles can only hold permissions the server catalog marks as scope-assignable. */
  lockNonScopeAssignable?: boolean;
  onToggleAction?: (permission: Permission) => void;
  readOnly: boolean;
  selected: readonly Permission[];
};

export function PermissionPicker({
  content,
  legend,
  lockNonDelegable,
  lockNonScopeAssignable = false,
  onToggleAction,
  readOnly,
  selected,
}: PermissionPickerProps) {
  const baseId = useId();

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.groups}>
        {PERMISSION_GROUP_VALUES.map((group) => {
          const groupTitleId = `${baseId}-${group}`;
          return (
            <section
              aria-labelledby={groupTitleId}
              className={styles.group}
              key={group}
            >
              <h3 className={styles.groupTitle} id={groupTitleId}>
                {content.groups[group]}
              </h3>
              <ul className={styles.items}>
                {PERMISSION_GROUP_PERMISSIONS[group].map((permission) => {
                  const lockedByDelegation =
                    lockNonDelegable &&
                    !PERMISSION_DEFINITIONS[permission].delegable;
                  const lockedByScope =
                    lockNonScopeAssignable &&
                    !PERMISSION_DEFINITIONS[permission].scopeAssignable;
                  const locked = lockedByDelegation || lockedByScope;
                  const text = content.permissions[permission];
                  const inputId = `${baseId}-${permission}`;
                  const descriptionId = `${inputId}-description`;
                  return (
                    <li
                      className={styles.item}
                      data-locked={locked ? "true" : "false"}
                      data-read-only={readOnly ? "true" : "false"}
                      key={permission}
                    >
                      <CheckboxControl
                        aria-describedby={descriptionId}
                        checked={selected.includes(permission)}
                        disabled={readOnly || locked}
                        id={inputId}
                        onChange={() => onToggleAction?.(permission)}
                      />
                      <label className={styles.text} htmlFor={inputId}>
                        <span className={styles.label}>
                          {text.label}
                          {locked ? (
                            <span className={styles.lockBadge}>
                              {lockedByDelegation
                                ? content.ownerOnly
                                : content.workspaceOnly}
                            </span>
                          ) : null}
                        </span>
                        <span className={styles.description} id={descriptionId}>
                          {locked
                            ? `${text.description} ${
                                lockedByDelegation
                                  ? content.ownerOnlyHint
                                  : content.workspaceOnlyHint
                              }`
                            : text.description}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </fieldset>
  );
}
