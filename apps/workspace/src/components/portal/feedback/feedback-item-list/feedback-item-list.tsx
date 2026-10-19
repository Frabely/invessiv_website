"use client";

import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { findOpenFeedbackClarification } from "@invessiv/common/patterns/crm/find-open-feedback-clarification";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { feedbackItemDomId } from "@/common/patterns/portal/feedback-item-dom-id";
import { FileAttachmentList } from "@/components/shared/files/file-attachment-list/file-attachment-list";
import { FeedbackClarificationThread } from "@/components/shared/feedback/feedback-clarification-thread/feedback-clarification-thread";
import { FeedbackItemResult } from "@/components/shared/feedback/feedback-item-result/feedback-item-result";
import { FeedbackReadOnlyItemContent } from "@/components/shared/feedback/feedback-read-only-item-content/feedback-read-only-item-content";
import type { Locale } from "@/config/i18n";
import { useFeedbackClarificationAnswers } from "@/hooks/portal/use-feedback-clarification-answers";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackClarificationAnswer } from "../feedback-clarification-answer/feedback-clarification-answer";
import styles from "./feedback-item-list.module.css";

export type FeedbackItemListProps = {
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  round: Pick<PortalFeedbackRoundDto, "id" | "items">;
  locale: Locale;
  /**
   * Whether this viewer may answer an open question of this round (`canAnswerFeedbackClarification`);
   * false for readers, the owner view and finished rounds.
   */
  canAnswer?: boolean;
  onAnnounceAction?: (message: string) => void;
};

function focusItem(itemId: string) {
  document.getElementById(feedbackItemDomId(itemId))?.focus();
}

/**
 * Points of a submitted round as the same cards as in the sheet: the customer's own words, the
 * questions about them beside them (below on narrow cards) and, once the round is done, what we
 * made of them. An open question can be answered right on the item.
 */
export function FeedbackItemList({
  content,
  customerId,
  filesContent,
  round,
  locale,
  canAnswer = false,
  onAnnounceAction,
}: FeedbackItemListProps) {
  const downloads = usePortalFileDownloads<FileAttachmentDto>(
    customerId,
    filesContent.errors,
  );
  const answers = useFeedbackClarificationAnswers(
    customerId,
    round.id,
    (itemId) => {
      const number = round.items.findIndex((item) => item.id === itemId) + 1;
      onAnnounceAction?.(
        formatMessage(content.announcements.clarificationAnswered, { number }),
      );
      // The answered form disappears; the item heading keeps the focus on this item.
      focusItem(itemId);
    },
  );
  const threadLabels = {
    ...content.clarifications.thread,
    // Only someone who can answer is the one the question waits for.
    statusOpen: canAnswer
      ? content.clarifications.statusWaiting
      : content.clarifications.thread.statusOpen,
    showMore: content.items.showMore,
    showLess: content.items.showLess,
  };

  return (
    <>
      <ol aria-label={content.editor.listLabel} className={styles.list}>
        {round.items.map((listed, index) => {
          const item = answers.itemFor(listed);
          const number = index + 1;
          const open = canAnswer
            ? findOpenFeedbackClarification(item.clarifications)
            : undefined;
          const staleDrafts = answers.staleDraftsOf(item.id, open?.id ?? null);
          const discussed =
            item.clarifications.length > 0 || staleDrafts.length > 0;
          return (
            <li
              className={styles.item}
              data-result={item.result ?? undefined}
              key={item.id}
            >
              <div
                className={styles.body}
                data-layout={discussed ? "split" : undefined}
              >
                <div className={styles.point}>
                  <FeedbackReadOnlyItemContent
                    generalLabel={content.editor.general}
                    item={item}
                    kindLabels={content.kinds}
                    leading={
                      <span
                        className={styles.number}
                        id={feedbackItemDomId(item.id)}
                        tabIndex={-1}
                      >
                        {formatMessage(content.editor.itemLabel, { number })}
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
                            number,
                          })}
                          loadPreviewAction={downloads.loadPreview}
                          locale={locale}
                          onDownloadAction={downloads.download}
                          texts={filesContent}
                        />
                      ) : null
                    }
                  />
                </div>
                {discussed ? (
                  <div className={styles.clarifications}>
                    <FeedbackClarificationThread
                      clarifications={item.clarifications}
                      label={formatMessage(content.clarifications.threadLabel, {
                        number,
                      })}
                      labels={threadLabels}
                      locale={locale}
                    >
                      {open ? (
                        <FeedbackClarificationAnswer
                          content={content}
                          draft={answers.draftFor(open.id)}
                          number={number}
                          onChangeAction={(text) =>
                            answers.change(item.id, open.id, text)
                          }
                          onSubmitAction={() =>
                            void answers.submit(item, open.id)
                          }
                        />
                      ) : null}
                    </FeedbackClarificationThread>
                    {staleDrafts.map((draft) => (
                      <FeedbackClarificationAnswer
                        content={content}
                        draft={draft}
                        key={draft.clarificationId}
                        number={number}
                        onChangeAction={() => undefined}
                        onDiscardAction={() =>
                          answers.discard(draft.clarificationId)
                        }
                        onSubmitAction={() => undefined}
                      />
                    ))}
                  </div>
                ) : null}
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
              </div>
            </li>
          );
        })}
      </ol>
      {downloads.actionError ? (
        <p className={styles.error} role="alert">
          {downloads.actionError}
        </p>
      ) : null}
    </>
  );
}
