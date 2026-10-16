"use client";

import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileAttachmentList } from "@/components/shared/files/file-attachment-list/file-attachment-list";
import { FeedbackItemResult } from "@/components/shared/feedback/feedback-item-result/feedback-item-result";
import { FeedbackReadOnlyItemContent } from "@/components/shared/feedback/feedback-read-only-item-content/feedback-read-only-item-content";
import type { Locale } from "@/config/i18n";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import styles from "./feedback-item-list.module.css";

export type FeedbackItemListProps = {
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  items: readonly PortalFeedbackItemDto[];
  locale: Locale;
};

/**
 * Points of a round that can no longer be edited, as the same cards as in the sheet: the
 * customer's own words on top, and once the round is done, what we made of them below.
 */
export function FeedbackItemList({
  content,
  customerId,
  filesContent,
  items,
  locale,
}: FeedbackItemListProps) {
  const downloads = usePortalFileDownloads<FileAttachmentDto>(
    customerId,
    filesContent.errors,
  );

  return (
    <>
      <ol aria-label={content.editor.listLabel} className={styles.list}>
        {items.map((item, index) => (
          <li
            className={styles.item}
            data-result={item.result ?? undefined}
            key={item.id}
          >
            <FeedbackReadOnlyItemContent
              generalLabel={content.editor.general}
              item={item}
              kindLabels={content.kinds}
              leading={
                <span className={styles.number}>
                  {formatMessage(content.editor.itemLabel, {
                    number: index + 1,
                  })}
                  <span className="sr-only">: </span>
                </span>
              }
              textLabels={{
                showMore: content.items.showMore,
                showLess: content.items.showLess,
              }}
              attachments={
                item.attachments.length > 0 ? (
                  <FileAttachmentList
                    attachments={item.attachments}
                    label={formatMessage(content.attachments.label, {
                      number: index + 1,
                    })}
                    loadPreviewAction={downloads.loadPreview}
                    locale={locale}
                    onDownloadAction={downloads.download}
                    texts={filesContent}
                  />
                ) : null
              }
            />
            {item.result ? (
              <div className={styles.result}>
                <FeedbackItemResult
                  label={content.result.choices[item.result]}
                  note={item.resultNote}
                  noteLabel={content.result.reply}
                  result={item.result}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {downloads.actionError ? (
        <p className={styles.error} role="alert">
          {downloads.actionError}
        </p>
      ) : null}
    </>
  );
}
