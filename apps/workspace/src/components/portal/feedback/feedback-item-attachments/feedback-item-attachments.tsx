"use client";

import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import { portalFilesApiService } from "@/client/portal/portal-files-api-service";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import { PortalAttachmentField } from "@/components/portal/shared/portal-attachment-field/portal-attachment-field";
import type { Locale } from "@/config/i18n";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";

export type FeedbackItemAttachmentsProps = {
  /** Detach; without it the files are only listed. */
  canAttach: boolean;
  /** Upload as well, which needs `portal.files.write` on top. */
  canUpload: boolean;
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  /** Saves the draft first, so the item exists on the server before a file hangs on it. */
  flushAction: () => Promise<boolean>;
  item: FeedbackDraftItem;
  locale: Locale;
  number: number;
  onAnnounceAction: (message: string) => void;
  onChangeAction: (
    update: (current: FileAttachmentDto[]) => FileAttachmentDto[],
  ) => void;
  onActivityChangeAction: (itemId: string, active: boolean) => void;
  /** Uploads land in the round's project, like a file sent from the files page. */
  projectId: string;
  roundId: string;
};

/** Files of one point: the shared portal attachment field bound to the point's endpoints. */
export function FeedbackItemAttachments({
  canAttach,
  canUpload,
  content,
  customerId,
  filesContent,
  flushAction,
  item,
  locale,
  number,
  onAnnounceAction,
  onChangeAction,
  onActivityChangeAction,
  projectId,
  roundId,
}: FeedbackItemAttachmentsProps) {
  const target = { roundId, itemId: item.id };

  return (
    <PortalAttachmentField
      attachAction={async (file) => {
        const result = await portalFeedbackApiService.attachFile(
          customerId,
          target,
          file.id,
        );
        return result.ok
          ? result
          : { ok: false, message: content.errors[result.code] };
      }}
      attachments={item.attachments}
      canAttach={canAttach}
      canUpload={canUpload}
      customerId={customerId}
      detachAction={async (file) => {
        const result = await portalFeedbackApiService.detachFile(
          customerId,
          target,
          file.id,
        );
        return result.ok
          ? { ok: true }
          : { ok: false, message: content.errors[result.code] };
      }}
      filesContent={filesContent}
      locale={locale}
      maxFiles={FEEDBACK_LIMITS.filesPerItem}
      onActivityChangeAction={(active) =>
        onActivityChangeAction(item.id, active)
      }
      onAttachedAction={(attachment) => {
        onChangeAction((current) =>
          current.some((entry) => entry.id === attachment.id)
            ? current
            : [...current, attachment],
        );
        onAnnounceAction(
          formatMessage(content.announcements.attached, {
            name: attachment.displayName,
            number,
          }),
        );
      }}
      onDetachedAction={(file) => {
        onChangeAction((current) =>
          current.filter((entry) => entry.id !== file.id),
        );
        onAnnounceAction(
          formatMessage(content.announcements.detached, {
            name: file.displayName,
          }),
        );
      }}
      prepareAction={flushAction}
      texts={{
        listLabel: formatMessage(content.attachments.label, { number }),
        queueLabel: formatMessage(content.attachments.queueLabel, { number }),
        dropLabel: content.attachments.dropLabel,
        dropHint: content.attachments.dropHint,
        detach: content.attachments.detach,
        detachTitle: content.attachments.detachTitle,
      }}
      transport={portalFilesApiService.uploadTransport(customerId, {
        projectId,
        note: null,
      })}
    />
  );
}
