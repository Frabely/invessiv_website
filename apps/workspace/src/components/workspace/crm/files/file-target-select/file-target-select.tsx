"use client";

import { FileProjectSelect } from "@invessiv/ui";
import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";

type FileTargetSelectProps = {
  content: CrmFilesDictionary;
  disabled?: boolean;
  projects: readonly CrmProjectOption[];
  /** Writable targets, null for customer-wide. With one target there is nothing to choose. */
  targets: readonly (string | null)[];
  value: string | null;
  onChangeAction: (target: string | null) => void;
};

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
    <FileProjectSelect
      disabled={disabled}
      label={content.upload.project}
      onChangeAction={onChangeAction}
      options={targets.map((target) => ({
        value: target ?? "",
        label:
          target === null
            ? content.upload.customerWideOption
            : (projects.find((project) => project.id === target)?.title ??
              target),
      }))}
      value={value}
    />
  );
}
