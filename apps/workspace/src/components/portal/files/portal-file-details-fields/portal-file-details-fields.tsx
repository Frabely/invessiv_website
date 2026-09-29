"use client";

import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { FileNoteField, FileProjectSelect } from "@invessiv/ui";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";

export type PortalFileDetailsFieldsProps = {
  content: PortalFilesDictionary;
  disabled?: boolean;
  note: string;
  /** Projects released to the portal; without any the choice is always "General". */
  projects: readonly PortalFileProjectOptionDto[];
  projectId: string | null;
  onNoteChangeAction: (note: string) => void;
  onProjectChangeAction: (projectId: string | null) => void;
};

/** What an upload or link belongs to, plus an optional note; shared by both portal dialogs. */
export function PortalFileDetailsFields({
  content,
  disabled = false,
  note,
  projects,
  projectId,
  onNoteChangeAction,
  onProjectChangeAction,
}: PortalFileDetailsFieldsProps) {
  return (
    <>
      {projects.length > 0 ? (
        <FileProjectSelect
          disabled={disabled}
          label={content.upload.project}
          onChangeAction={onProjectChangeAction}
          options={[
            { value: "", label: content.upload.generalOption },
            ...projects.map((project) => ({
              value: project.id,
              label: project.title,
            })),
          ]}
          value={projectId}
        />
      ) : null}
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
