"use client";

import { useState } from "react";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { FileUploadDialogFrame } from "@invessiv/ui";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { Locale } from "@/config/i18n";
import { useInitialUploadFiles } from "@/hooks/shared/use-initial-upload-files";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileDetailsFields } from "../portal-file-details-fields/portal-file-details-fields";

export type PortalFileUploadDialogProps = {
  content: PortalFilesDictionary;
  customerId: string;
  initialFiles: readonly File[];
  locale: Locale;
  projects: readonly PortalFileProjectOptionDto[];
  onCloseAction: () => void;
  onUploadedAction: (file: PortalFileDto) => void;
};

/** Portal-specific destination around the shared upload queue presentation. */
export function PortalFileUploadDialog({
  content,
  customerId,
  initialFiles,
  locale,
  projects,
  onCloseAction,
  onUploadedAction,
}: PortalFileUploadDialogProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const queue = useUploadQueue<PortalFileDto>(
    portalFilesApiService.uploadTransport(customerId, {
      projectId,
      note: note.trim() || null,
    }),
    { onUploadedAction },
  );
  useInitialUploadFiles(initialFiles, queue.stage);

  return (
    <FileUploadDialogFrame
      fields={
        <PortalFileDetailsFields
          content={content}
          disabled={queue.hasStarted}
          note={note}
          onNoteChangeAction={setNote}
          onProjectChangeAction={setProjectId}
          projectId={projectId}
          projects={projects}
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
