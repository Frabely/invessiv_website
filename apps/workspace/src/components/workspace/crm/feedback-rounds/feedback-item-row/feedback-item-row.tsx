"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FeedbackItemProcessingState } from "@invessiv/common/constants/crm/feedback-item-processing-states";
import {
  FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE,
  type FeedbackItemResult as FeedbackItemResultValue,
} from "@invessiv/common/constants/crm/feedback-item-results";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { getFeedbackItemProcessingState } from "@invessiv/common/patterns/crm/feedback-item-processing-state";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";
import { FeedbackClarificationPart } from "@/common/constants/feedback/feedback-clarification-parts";
import { FeedbackProcessingError } from "@/common/constants/feedback/feedback-processing-errors";
import { FeedbackResultChoice } from "@/common/constants/feedback/feedback-result-choices";
import { feedbackProcessingError } from "@/common/patterns/crm/feedback-processing-error";
import { FeedbackClarificationThread } from "@/components/shared/feedback/feedback-clarification-thread/feedback-clarification-thread";
import { FeedbackItemResult } from "@/components/shared/feedback/feedback-item-result/feedback-item-result";
import { FeedbackReadOnlyItemContent } from "@/components/shared/feedback/feedback-read-only-item-content/feedback-read-only-item-content";
import { StatusRow } from "@/components/workspace/shared/status-row/status-row";
import type { Locale } from "@/config/i18n";
import { useFocusAfterVersion } from "@/hooks/shared/use-focus-after-version";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackClarificationActions } from "../feedback-clarification-actions/feedback-clarification-actions";
import { FeedbackItemResultSelect } from "../feedback-item-result-select/feedback-item-result-select";
import { FeedbackResultHistory } from "../feedback-result-history/feedback-result-history";
import { FeedbackTextDialog } from "../feedback-text-dialog/feedback-text-dialog";
import styles from "./feedback-item-row.module.css";

type FeedbackItemRowProps = {
  content: CrmFeedbackRoundsDictionary;
  item: FeedbackRoundItemDto;
  number: number;
  locale: Locale;
  /** The round is submitted and not finished yet, and the member may write the project. */
  editable: boolean;
  /** Results exist from the submission on; a draft item has none to show. */
  showResult: boolean;
  onAnnounceAction: (message: string) => void;
  /** Rendered only with `files.read` on the project; without it the item shows text only. */
  attachments?: ReactNode;
};

function requiresNote(result: FeedbackItemResultValue): boolean {
  return (FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE as readonly string[]).includes(
    result,
  );
}

/**
 * One customer item as the team reads and rates it. "Implemented" saves at once; the other two
 * results ask for a reply first. The chosen result shows right away and gives way to the server's
 * state as soon as the refreshed item arrives with a newer version. While a question is open, the
 * result stays locked until the customer answers or the team closes the question.
 */
export function FeedbackItemRow({
  content,
  item: listedItem,
  number,
  locale,
  editable,
  showResult,
  onAnnounceAction,
  attachments,
}: FeedbackItemRowProps) {
  const router = useRouter();
  const [latest, setLatest] = useState<FeedbackRoundItemDto | null>(null);
  const item =
    latest && latest.id === listedItem.id && latest.version > listedItem.version
      ? latest
      : listedItem;
  const texts = content.result;
  const [pending, setPending] = useState<{
    result: FeedbackItemResultValue | null;
    baseVersion: number;
  } | null>(null);
  const [noteFor, setNoteFor] = useState<FeedbackItemResultValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Keep the action and its dialogs mounted while the question changes behind them.
  const actionFocus = useFocusAfterVersion<HTMLButtonElement>(item.version);
  const awaitingClarification =
    getFeedbackItemProcessingState(item) ===
    FeedbackItemProcessingState.Clarification;
  const shown =
    pending && pending.baseVersion === item.version
      ? pending.result
      : item.result;

  function announceSaved(result: FeedbackItemResultValue | null) {
    onAnnounceAction(
      formatMessage(
        result === null
          ? content.announcements.resultReset
          : content.announcements.resultSaved,
        {
          number,
          result: texts.choices[result ?? FeedbackResultChoice.Pending],
        },
      ),
    );
  }

  async function saveImmediateResult(result: FeedbackItemResultValue | null) {
    setError(null);
    setPending({ result, baseVersion: item.version });
    const saved = await feedbackRoundsApiService.setItemResult(item.id, {
      commandId: crypto.randomUUID(),
      version: item.version,
      result,
      resultNote: null,
    });
    if (saved.ok) {
      announceSaved(result);
      router.refresh();
      return;
    }
    setPending(null);
    setError(
      content.processingErrors[
        saved.code === ConcurrencyErrorCode.VersionConflict
          ? FeedbackProcessingError.Changed
          : feedbackProcessingError(saved.code)
      ],
    );
    router.refresh();
  }

  function choose(result: FeedbackItemResultValue | null) {
    if (result !== null && requiresNote(result)) setNoteFor(result);
    else void saveImmediateResult(result);
  }

  const clarificationActions = (
    <FeedbackClarificationActions
      buttonRef={actionFocus.ref}
      content={content}
      item={item}
      editable={editable}
      onCurrentAction={setLatest}
      number={number}
      onAnnounceAction={onAnnounceAction}
      onSavedAction={(saved) => actionFocus.focusAfter(saved.version)}
    />
  );

  const itemContent = (
    <FeedbackReadOnlyItemContent
      attachments={attachments}
      generalLabel={content.detail.general}
      item={item}
      kindLabels={content.kind}
      leading={
        <span className={styles.number}>
          {formatMessage(content.detail.itemNumber, { number })}
        </span>
      }
      textLabels={{
        showMore: content.detail.showMore,
        showLess: content.detail.showLess,
      }}
    />
  );

  const clarificationThread = (
    <FeedbackClarificationThread
      authorName={(clarification, part) =>
        part === FeedbackClarificationPart.Question
          ? clarification.requestedByName
          : part === FeedbackClarificationPart.Answer
            ? clarification.answeredByName
            : clarification.closedByName
      }
      clarifications={item.clarifications}
      label={formatMessage(content.clarification.threadLabel, { number })}
      labels={{
        ...content.clarification.thread,
        showMore: content.detail.showMore,
        showLess: content.detail.showLess,
      }}
      locale={locale}
    />
  );

  const resultHistory = (
    <FeedbackResultHistory
      entries={item.resultHistory}
      content={texts}
      locale={locale}
      textLabels={{
        showMore: content.detail.showMore,
        showLess: content.detail.showLess,
      }}
    />
  );
  if (!showResult)
    return (
      <li className={styles.item}>
        {itemContent}
        {clarificationThread}
        {resultHistory}
      </li>
    );

  return (
    <StatusRow
      alignStart
      detailsClassName={styles.details}
      pending={pending !== null && pending.baseVersion === item.version}
      status={
        editable ? (
          <FeedbackItemResultSelect
            content={texts}
            disabled={pending !== null && pending.baseVersion === item.version}
            locked={awaitingClarification}
            number={number}
            onChangeAction={choose}
            result={shown}
          />
        ) : awaitingClarification ? (
          <span
            className={styles.open}
            data-state={FeedbackItemProcessingState.Clarification}
          >
            {texts.choices.clarification}
          </span>
        ) : shown ? (
          <FeedbackItemResult
            label={texts.choices[shown]}
            note={null}
            noteLabel={texts.reply}
            result={shown}
          />
        ) : (
          <span className={styles.open}>{texts.choices.pending}</span>
        )
      }
    >
      {itemContent}
      {clarificationThread}
      {item.result && item.resultNote ? (
        <div className={styles.reply}>
          <FeedbackItemResult
            label={texts.choices[item.result]}
            note={item.resultNote}
            noteLabel={texts.reply}
            result={item.result}
            showBadge={false}
          />
          {editable ? (
            <ButtonControl
              onClick={() => item.result && setNoteFor(item.result)}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPen} />
              {formatMessage(texts.editReply, { number })}
            </ButtonControl>
          ) : null}
        </div>
      ) : null}
      {clarificationActions}
      {resultHistory}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {noteFor ? (
        <FeedbackTextDialog<FeedbackRoundItemDto>
          common={content.textDialog}
          errorMessage={(code) =>
            content.processingErrors[feedbackProcessingError(code)]
          }
          initial={item}
          locked={!editable}
          onCurrentAction={setLatest}
          initialText={item.result === noteFor ? (item.resultNote ?? "") : ""}
          onCloseAction={() => setNoteFor(null)}
          onSavedAction={() => announceSaved(noteFor)}
          preview={(note) => (
            <FeedbackItemResult
              label={texts.choices[noteFor]}
              note={note}
              noteLabel={content.textDialog.customerReplyLabel}
              result={noteFor}
            />
          )}
          required
          send={(current, note, commandId) =>
            feedbackRoundsApiService.setItemResult(current.id, {
              commandId,
              version: current.version,
              result: noteFor,
              resultNote: note,
            })
          }
          texts={{
            ...texts.note[noteFor as keyof typeof texts.note],
            ...texts.noteCommon,
            title: formatMessage(texts.noteCommon.title, { number }),
          }}
        />
      ) : null}
    </StatusRow>
  );
}
