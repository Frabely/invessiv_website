"use client";

import { useState } from "react";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { FileUploadDialogFrame } from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { Locale } from "@/config/i18n";
import { useInitialUploadFiles } from "@/hooks/shared/use-initial-upload-files";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileMetadataFields } from "../file-metadata-fields/file-metadata-fields";

type FileUploadDialogProps = {
  content: CrmFilesDictionary;
  customerId: string;
  initialFiles?: readonly File[];
  locale: Locale;
  projects: readonly FilesProjectOption[];
  targets: readonly (string | null)[];
  defaultTarget: string | null;
  onCloseAction: () => void;
  onUploadedAction: (file: FileDto) => void;
};

/** CRM-specific target and visibility around the shared upload queue presentation. */
export function FileUploadDialog({
  content,
  customerId,
  initialFiles,
  locale,
  projects,
  targets,
  defaultTarget,
  onCloseAction,
  onUploadedAction,
}: FileUploadDialogProps) {
  const [target, setTarget] = useState<string | null>(defaultTarget);
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");
  const queue = useUploadQueue(
    {
      createTicket: (file) =>
        filesApiService.createUpload(customerId, {
          displayName: file.name,
          sizeBytes: file.size,
          projectId: target,
          visibleToCustomer: visible,
          note: note.trim() || null,
        }),
      complete: filesApiService.completeUpload,
      cancelPending: filesApiService.cancelPendingUpload,
    },
    { onUploadedAction },
  );
  useInitialUploadFiles(initialFiles, queue.stage);

  return (
    <FileUploadDialogFrame
      fields={
        <FileMetadataFields
          content={content}
          disabled={queue.hasStarted}
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
      labels={content.upload}
      locale={locale}
      onCloseAction={onCloseAction}
      queue={queue}
      rowLabels={{ ...content.upload, errors: content.errors }}
    />
  );
}
