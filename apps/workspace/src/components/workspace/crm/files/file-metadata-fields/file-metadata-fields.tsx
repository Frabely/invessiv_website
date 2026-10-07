"use client";

import { FileNoteField } from "@invessiv/ui";
import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileTargetSelect } from "../file-target-select/file-target-select";
import { FileVisibilityField } from "../file-visibility-field/file-visibility-field";

export type FileMetadataFieldsProps = {
  content: CrmFilesDictionary;
  projects: readonly CrmProjectOption[];
  targets: readonly (string | null)[];
  target: string | null;
  visibleToCustomer: boolean;
  note: string;
  disabled?: boolean;
  visibilityLocked?: boolean;
  onTargetChangeAction: (target: string | null) => void;
  onVisibilityChangeAction: (visible: boolean) => void;
  onNoteChangeAction: (note: string) => void;
};

/** Shared project, visibility and note fields for adding and editing file entries. */
export function FileMetadataFields({
  content,
  projects,
  targets,
  target,
  visibleToCustomer,
  note,
  disabled = false,
  visibilityLocked = false,
  onTargetChangeAction,
  onVisibilityChangeAction,
  onNoteChangeAction,
}: FileMetadataFieldsProps) {
  return (
    <>
      <FileTargetSelect
        content={content}
        disabled={disabled}
        onChangeAction={onTargetChangeAction}
        projects={projects}
        targets={targets}
        value={target}
      />
      <FileVisibilityField
        checked={visibleToCustomer}
        content={content}
        disabled={disabled}
        locked={visibilityLocked}
        onChangeAction={onVisibilityChangeAction}
      />
      <FileNoteField
        disabled={disabled}
        label={content.upload.note}
        onChangeAction={onNoteChangeAction}
        placeholder={content.upload.notePlaceholder}
        value={note}
      />
    </>
  );
}
