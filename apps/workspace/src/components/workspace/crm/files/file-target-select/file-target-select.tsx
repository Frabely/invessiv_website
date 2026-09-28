"use client";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "@invessiv/ui";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./file-target-select.module.css";

type FileTargetSelectProps = {
  content: CrmFilesDictionary;
  disabled?: boolean;
  projects: readonly FilesProjectOption[];
  /** Writable targets, null for customer-wide. With one target there is nothing to choose. */
  targets: readonly (string | null)[];
  value: string | null;
  onChangeAction: (target: string | null) => void;
};

const CUSTOMER_WIDE_VALUE = "";

export function FileTargetSelect({
  content,
  disabled = false,
  projects,
  targets,
  value,
  onChangeAction,
}: FileTargetSelectProps) {
  if (targets.length < 2) return null;
  return (
    <FormField
      kind={FormFieldKind.Custom}
      label={content.upload.project}
      renderControl={({ describedBy, id }) => (
        <select
          aria-describedby={describedBy}
          className={styles.select}
          disabled={disabled}
          id={id}
          onChange={(event) =>
            onChangeAction(
              event.target.value === CUSTOMER_WIDE_VALUE
                ? null
                : event.target.value,
            )
          }
          value={value ?? CUSTOMER_WIDE_VALUE}
        >
          {targets.map((target) => (
            <option
              key={target ?? CUSTOMER_WIDE_VALUE}
              value={target ?? CUSTOMER_WIDE_VALUE}
            >
              {target === null
                ? content.upload.customerWideOption
                : (projects.find((project) => project.id === target)?.title ??
                  target)}
            </option>
          ))}
        </select>
      )}
    />
  );
}
