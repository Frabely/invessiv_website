"use client";

import { CheckboxControl } from "@invessiv/ui";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./file-visibility-field.module.css";

type FileVisibilityFieldProps = {
  checked: boolean;
  content: CrmFilesDictionary;
  disabled?: boolean;
  /** Customer uploads always stay visible; the switch is then replaced by an explanation. */
  locked?: boolean;
  onChangeAction: (checked: boolean) => void;
};

export function FileVisibilityField({
  checked,
  content,
  disabled = false,
  locked = false,
  onChangeAction,
}: FileVisibilityFieldProps) {
  if (locked)
    return <p className={styles.hint}>{content.edit.customerLocked}</p>;
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        <CheckboxControl
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChangeAction(event.target.checked)}
        />
        <span>{content.upload.visible}</span>
      </label>
      <p className={styles.hint}>{content.upload.visibleHint}</p>
    </div>
  );
}
