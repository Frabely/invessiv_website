"use client";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "@invessiv/ui";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileTargetSelect } from "../file-target-select/file-target-select";
import { FileVisibilityField } from "../file-visibility-field/file-visibility-field";

export type FileMetadataFieldsProps = {
  content: CrmFilesDictionary;
  projects: readonly FilesProjectOption[];
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
      <FormField
        inputProps={{
          disabled,
          maxLength: 200,
          onChange: (event) => onNoteChangeAction(event.target.value),
          placeholder: content.upload.notePlaceholder,
          value: note,
        }}
        kind={FormFieldKind.Text}
        label={content.upload.note}
      />
    </>
  );
}
