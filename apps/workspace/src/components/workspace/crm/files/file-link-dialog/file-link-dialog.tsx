"use client";

import { useState } from "react";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { FileLinkDialogFrame } from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileMetadataFields } from "../file-metadata-fields/file-metadata-fields";

type FileLinkDialogProps = {
  content: CrmFilesDictionary;
  customerId: string;
  projects: readonly FilesProjectOption[];
  targets: readonly (string | null)[];
  defaultTarget: string | null;
  onCloseAction: () => void;
  onCreatedAction: (file: FileDto) => void;
};

export function FileLinkDialog({
  content,
  customerId,
  projects,
  targets,
  defaultTarget,
  onCloseAction,
  onCreatedAction,
}: FileLinkDialogProps) {
  const [target, setTarget] = useState<string | null>(defaultTarget);
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");

  return (
    <FileLinkDialogFrame
      cancelLabel={content.upload.cancel}
      closeLabel={content.upload.close}
      fields={
        <FileMetadataFields
          content={content}
          note={note}
          onNoteChangeAction={setNote}
          onTargetChangeAction={setTarget}
          onVisibilityChangeAction={setVisible}
          projects={projects}
          targets={targets}
          target={target}
          visibleToCustomer={visible}
        />
      }
      labels={content.link}
      onCloseAction={onCloseAction}
      onSubmitAction={async (displayName, url) => {
        const result = await filesApiService.createLink(customerId, {
          displayName,
          url,
          projectId: target,
          visibleToCustomer: visible,
          note: note.trim() || null,
        });
        if (!result.ok) return content.errors[result.code];
        onCreatedAction(result.value);
        return null;
      }}
    />
  );
}
