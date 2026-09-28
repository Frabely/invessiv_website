"use client";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { CustomSelect, FormField } from "@invessiv/ui";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";

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
        <CustomSelect
          ariaLabel={content.upload.project}
          describedBy={describedBy}
          disabled={disabled}
          id={id}
          onChange={(nextValue) =>
            onChangeAction(nextValue === CUSTOMER_WIDE_VALUE ? null : nextValue)
          }
          options={targets.map((target) => ({
            value: target ?? CUSTOMER_WIDE_VALUE,
            label:
              target === null
                ? content.upload.customerWideOption
                : (projects.find((project) => project.id === target)?.title ??
                  target),
          }))}
          value={value ?? CUSTOMER_WIDE_VALUE}
        />
      )}
    />
  );
}
