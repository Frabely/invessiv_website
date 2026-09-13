"use client";

import { useId } from "react";

import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
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
  onToggleAction?: (permission: Permission) => void;
  readOnly: boolean;
  selected: readonly Permission[];
};

export function PermissionPicker({
  content,
  legend,
  lockNonDelegable,
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
                  const locked =
                    lockNonDelegable &&
                    !PERMISSION_DEFINITIONS[permission].delegable;
                  const text = content.permissions[permission];
                  const inputId = `${baseId}-${permission}`;
                  const descriptionId = `${inputId}-description`;
                  return (
                    <li
                      className={styles.item}
                      data-locked={locked ? "true" : "false"}
                      key={permission}
                    >
                      <input
                        aria-describedby={descriptionId}
                        checked={selected.includes(permission)}
                        className={styles.checkbox}
                        disabled={readOnly || locked}
                        id={inputId}
                        onChange={() => onToggleAction?.(permission)}
                        type="checkbox"
                      />
                      <label className={styles.text} htmlFor={inputId}>
                        <span className={styles.label}>
                          {text.label}
                          {locked ? (
                            <span className={styles.lockBadge}>
                              {content.ownerOnly}
                            </span>
                          ) : null}
                        </span>
                        <span className={styles.description} id={descriptionId}>
                          {locked
                            ? `${text.description} ${content.ownerOnlyHint}`
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
