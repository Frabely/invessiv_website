"use client";

import Link from "next/link";
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faFileZipper,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  FeedbackRoundStatus,
  RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES,
} from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, LinkedText } from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import { FileAttachmentList } from "@/components/shared/files/file-attachment-list/file-attachment-list";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import type { Locale } from "@/config/i18n";
import { useFileDownloads } from "@/hooks/shared/use-file-downloads";
import { useMarkFeedbackRoundRead } from "@/hooks/workspace/crm/use-mark-feedback-round-read";
import type {
  CrmFeedbackRoundsDictionary,
  CrmFilesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { FeedbackItemRow } from "../feedback-item-row/feedback-item-row";
import { FeedbackResultProgress } from "../feedback-result-progress/feedback-result-progress";
import { FeedbackRoundStatusActions } from "../feedback-round-status-actions/feedback-round-status-actions";
import styles from "./feedback-round-detail.module.css";

type FeedbackRoundDetailProps = {
  backHref: string;
  content: CrmFeedbackRoundsDictionary;
  customerId: string;
  /** Attachments, preview and ZIP need `files.read` on the project; items show without it. */
  canReadFiles: boolean;
  filesContent: CrmFilesDictionary;
  locale: Locale;
  round: FeedbackRoundDto;
  /** `projects.write` on the project: status steps and item results. */
  canWrite: boolean;
  /** Round steps in the track; the completion offers the next round only below it. */
  included: number;
  processSteps: readonly string[];
  feedbackRoundPositions: readonly number[];
  onAnnounceAction: (message: string) => void;
  onHandOverNextAction: () => void;
};

/** Submission wins over the draft: once submitted, who submitted is what the team needs. */
function lastEdit(
  round: FeedbackRoundDto,
  texts: CrmFeedbackRoundsDictionary["detail"],
  locale: Locale,
): string {
  if (round.submittedAt) {
    const date = formatMomentDay(round.submittedAt, locale);
    return round.submittedByName
      ? formatMessage(texts.submittedBy, { name: round.submittedByName, date })
      : formatMessage(texts.submittedAt, { date });
  }
  if (!round.draftUpdatedAt) return texts.noDraft;
  const date = formatMomentDay(round.draftUpdatedAt, locale);
  return round.draftUpdatedByName
    ? formatMessage(texts.draftBy, { name: round.draftUpdatedByName, date })
    : formatMessage(texts.draftAt, { date });
}

/** One round as the team reads it: what was handed over, who submitted, every item with its files. */
export function FeedbackRoundDetail({
  backHref,
  canReadFiles,
  content,
  customerId,
  filesContent,
  locale,
  round,
  canWrite,
  included,
  processSteps,
  feedbackRoundPositions,
  onAnnounceAction,
  onHandOverNextAction,
}: FeedbackRoundDetailProps) {
  useMarkFeedbackRoundRead(round);
  const texts = content.detail;
  const headingId = `feedback-round-${round.id}`;
  const showResults = round.status !== FeedbackRoundStatus.Open;
  const editableResults =
    canWrite &&
    (
      RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]
    ).includes(round.status);
  const noticeVisible =
    round.customerNotice !== null &&
    (round.status === FeedbackRoundStatus.InDiscussion ||
      round.status === FeedbackRoundStatus.Open);
  const attachmentIds = round.items.flatMap((item) =>
    item.attachments.map((file) => file.id),
  );
  const downloads = useFileDownloads({
    archiveFilename: formatMessage(texts.archiveFilename, {
      number: round.roundNumber,
    }),
    errors: filesContent.errors,
    selectedIds: attachmentIds,
    clearSelection: () => undefined,
    getDownloadUrl: filesApiService.getDownloadUrl,
    readText: filesApiService.readText,
    getArchive: (ids) => filesApiService.downloadArchive(customerId, ids),
  });

  return (
    <article aria-labelledby={headingId} className={styles.detail}>
      <Link className={styles.back} href={backHref} scroll={false}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {texts.back}
      </Link>
      <header className={styles.header}>
        <h4 id={headingId}>
          {formatMessage(texts.title, { number: round.roundNumber })}
        </h4>
        <FeedbackRoundStatusBadge
          label={content.status[round.status]}
          status={round.status}
        />
      </header>
      <p className={styles.meta}>
        <span>
          {formatMessage(content.row.handedOver, {
            date: formatMomentDay(round.handedOverAt, locale),
          })}
        </span>
        {round.dueOn ? (
          <span>
            {formatMessage(texts.due, {
              date: formatCalendarDay(round.dueOn, locale),
            })}
          </span>
        ) : null}
        <span>{lastEdit(round, texts, locale)}</span>
      </p>
      {round.previewUrl ? (
        <a
          className={styles.preview}
          href={round.previewUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faArrowUpRightFromSquare} />
          {texts.preview}
          <span className="sr-only"> ({texts.opensInNewTab})</span>
        </a>
      ) : null}
      {round.handoverNote ? (
        <div className={styles.note}>
          <h5>{texts.handoverNote}</h5>
          <p>
            <LinkedText text={round.handoverNote} />
          </p>
        </div>
      ) : null}
      {noticeVisible ? (
        <div className={styles.notice}>
          <h5>{texts.customerNotice}</h5>
          <p>
            <LinkedText text={round.customerNotice ?? ""} />
          </p>
        </div>
      ) : null}
      {round.status === FeedbackRoundStatus.Open ? (
        <p className={styles.hint}>{texts.openHint}</p>
      ) : null}
      {canWrite ? (
        <FeedbackRoundStatusActions
          content={content}
          included={included}
          processSteps={processSteps}
          feedbackRoundPositions={feedbackRoundPositions}
          onAnnounceAction={onAnnounceAction}
          onHandOverNextAction={onHandOverNextAction}
          round={round}
        />
      ) : null}
      <section aria-labelledby={`${headingId}-items`} className={styles.items}>
        <div className={styles.itemsHead}>
          <h5 id={`${headingId}-items`}>{texts.itemsTitle}</h5>
          {showResults && round.items.length > 0 ? (
            <FeedbackResultProgress
              items={round.items}
              label={content.progress.label}
            />
          ) : null}
          {canReadFiles && attachmentIds.length > 0 ? (
            <ButtonControl
              disabled={downloads.archiveBusy}
              onClick={downloads.downloadArchive}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faFileZipper} />
              {downloads.archiveBusy ? texts.archiveBusy : texts.archive}
            </ButtonControl>
          ) : null}
        </div>
        {downloads.actionError ? (
          <p className={styles.error} role="alert">
            {downloads.actionError}
          </p>
        ) : null}
        {round.items.length === 0 ? (
          <p className={styles.hint}>{texts.itemsEmpty}</p>
        ) : (
          <ol className={styles.list}>
            {round.items.map((item, index) => (
              <FeedbackItemRow
                attachments={
                  canReadFiles && item.attachments.length > 0 ? (
                    <FileAttachmentList
                      attachments={item.attachments}
                      label={formatMessage(texts.attachments, {
                        number: index + 1,
                      })}
                      loadPreviewAction={downloads.loadPreview}
                      locale={locale}
                      onDownloadAction={downloads.download}
                      texts={filesContent}
                    />
                  ) : undefined
                }
                content={content}
                editable={editableResults}
                item={item}
                key={item.id}
                number={index + 1}
                onAnnounceAction={onAnnounceAction}
                showResult={showResults}
              />
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
