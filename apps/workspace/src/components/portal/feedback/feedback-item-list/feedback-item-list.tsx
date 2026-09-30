"use client";

import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FeedbackAttachmentList } from "@/components/shared/feedback/feedback-attachment-list/feedback-attachment-list";
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

/** Points of a round that can no longer be edited: submitted, in the works or finished. */
export function FeedbackItemList({
  content,
  customerId,
  filesContent,
  items,
  locale,
}: FeedbackItemListProps) {
  const downloads = usePortalFileDownloads<FeedbackAttachmentDto>(
    customerId,
    filesContent.errors,
  );

  return (
    <>
      <ol aria-label={content.editor.listLabel} className={styles.list}>
        {items.map((item, index) => (
          <li className={styles.item} key={item.id}>
            <span aria-hidden="true" className={styles.number}>
              {index + 1}
            </span>
            <FeedbackReadOnlyItemContent
              compact
              generalLabel={content.editor.general}
              item={item}
              kindLabels={content.kinds}
              leading={
                <span className="sr-only">
                  {formatMessage(content.editor.itemLabel, {
                    number: index + 1,
                  })}
                  :{" "}
                </span>
              }
              textLabels={{
                showMore: content.history.showMore,
                showLess: content.history.showLess,
              }}
              attachments={
                item.attachments.length > 0 ? (
                  <FeedbackAttachmentList
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
