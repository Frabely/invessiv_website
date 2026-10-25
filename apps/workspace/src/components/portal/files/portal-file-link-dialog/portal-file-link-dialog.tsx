import { type ReactNode, useState } from "react";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import type { TabPanelBinding } from "@invessiv/common/contracts/ui/tab-panel-binding";
import { FileLinkDialogFrame } from "@invessiv/ui";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileDetailsFields } from "../portal-file-details-fields/portal-file-details-fields";

export type PortalFileLinkDialogProps = {
  content: PortalFilesDictionary;
  customerId: string;
  projects: readonly PortalFileProjectOptionDto[];
  initialProjectId?: string | null;
  /** Makes the content the panel of the tab list rendered as navigation. */
  navigationPanel?: TabPanelBinding;
  renderNavigation?: (busy: boolean, hasDraft: boolean) => ReactNode;
  onCloseAction: () => void;
  onCreatedAction: (file: PortalFileDto) => void;
};

export function PortalFileLinkDialog({
  content,
  customerId,
  projects,
  initialProjectId = null,
  navigationPanel,
  renderNavigation,
  onCloseAction,
  onCreatedAction,
}: PortalFileLinkDialogProps) {
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [note, setNote] = useState("");

  return (
    <FileLinkDialogFrame
      cancelLabel={content.upload.cancel}
      closeLabel={content.upload.cancel}
      fields={
        <PortalFileDetailsFields
          content={content}
          note={note}
          onNoteChangeAction={setNote}
          onProjectChangeAction={setProjectId}
          projectId={projectId}
          projects={projects}
        />
      }
      labels={{ ...content.link, title: content.add.title }}
      navigationPanel={navigationPanel}
      renderNavigation={
        renderNavigation
          ? (busy, hasDraft) =>
              renderNavigation(busy, hasDraft || !!note.trim())
          : undefined
      }
      onCloseAction={onCloseAction}
      onSubmitAction={async (displayName, url) => {
        const result = await portalFilesApiService.createLink(customerId, {
          displayName,
          url,
          projectId,
          note: note.trim() || null,
        });
        if (!result.ok) return content.errors[result.code];
        onCreatedAction(result.value);
        return null;
      }}
    />
  );
}
