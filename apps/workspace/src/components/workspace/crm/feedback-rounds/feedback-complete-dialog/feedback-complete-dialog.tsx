"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_ITEM_RESULT_VALUES } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import {
  feedbackRoundStepPosition,
  isNextFeedbackRoundAdjacent,
} from "@invessiv/common/patterns/crm/feedback-round-state";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";
import { FEEDBACK_ITEM_RESULT_BADGES } from "@/common/constants/feedback/feedback-item-result-badges";
import { FeedbackProcessingError } from "@/common/constants/feedback/feedback-processing-errors";
import { feedbackProcessingError } from "@/common/patterns/crm/feedback-processing-error";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackResultProgress } from "../feedback-result-progress/feedback-result-progress";
import styles from "./feedback-complete-dialog.module.css";

type FeedbackCompleteDialogProps = {
  content: CrmFeedbackRoundsDictionary;
  round: FeedbackRoundDto;
  /** Round steps in the track; decides whether a next round can follow. */
  included: number;
  processSteps: readonly string[];
  feedbackRoundPositions: readonly number[];
  onCloseAction: () => void;
  onCompletedAction: (round: FeedbackRoundDto) => void;
  /** Opens the prefilled handover of the next round. */
  onHandOverNextAction: () => void;
};

/**
 * Checks that every item has a result, completes the round and then points to what comes next:
 * the next round while the track has one, otherwise the customer's approval.
 */
export function FeedbackCompleteDialog({
  content,
  round,
  included,
  processSteps,
  feedbackRoundPositions,
  onCloseAction,
  onCompletedAction,
  onHandOverNextAction,
}: FeedbackCompleteDialogProps) {
  const router = useRouter();
  const texts = content.complete;
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missing = round.items.filter((item) => item.result === null).length;
  const total = round.items.length;
  const nextNumber = round.roundNumber + 1;
  const hasNextRound = nextNumber <= included;
  const nextRoundAdjacent =
    hasNextRound &&
    isNextFeedbackRoundAdjacent(
      feedbackRoundPositions,
      processSteps.length,
      round.roundNumber,
    );
  const position = feedbackRoundStepPosition(
    feedbackRoundPositions,
    processSteps.length,
    round.roundNumber,
  );
  const nextStep = position === null ? null : (processSteps[position] ?? null);

  async function complete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await feedbackRoundsApiService.changeStatus(round.id, {
      version: round.version,
      to: FeedbackRoundStatus.Completed,
    });
    setBusy(false);
    if (result.ok) {
      setDone(true);
      onCompletedAction(result.value);
      return;
    }
    setError(
      content.processingErrors[
        result.code === ConcurrencyErrorCode.VersionConflict
          ? FeedbackProcessingError.Changed
          : feedbackProcessingError(result.code)
      ],
    );
    router.refresh();
  }

  if (done)
    return (
      <Dialog
        closeLabel={texts.close}
        description={
          nextRoundAdjacent
            ? formatMessage(texts.nextDescription, {
                next: nextNumber,
                remaining: included - round.roundNumber,
                included,
              })
            : hasNextRound && nextStep
              ? formatMessage(texts.continueWithStep, {
                  step: nextStep,
                  next: nextNumber,
                })
              : texts.approvalHint
        }
        footer={
          nextRoundAdjacent ? (
            <>
              <ButtonControl
                onClick={onCloseAction}
                type="button"
                variant="ghost"
              >
                {texts.later}
              </ButtonControl>
              <PrimaryCtaButton
                onClick={() => {
                  onCloseAction();
                  onHandOverNextAction();
                }}
                type="button"
              >
                {formatMessage(texts.handOverNext, { next: nextNumber })}
              </PrimaryCtaButton>
            </>
          ) : (
            <PrimaryCtaButton onClick={onCloseAction} type="button">
              {texts.close}
            </PrimaryCtaButton>
          )
        }
        onCloseAction={onCloseAction}
        size={DialogSize.Narrow}
        title={formatMessage(texts.doneTitle, { number: round.roundNumber })}
      />
    );

  return (
    <Dialog
      busy={busy}
      closeLabel={texts.close}
      description={texts.description}
      footer={
        <>
          <ButtonControl
            disabled={busy}
            onClick={onCloseAction}
            type="button"
            variant="ghost"
          >
            {texts.cancel}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={busy || missing > 0 || total === 0}
            onClick={() => void complete()}
            type="button"
          >
            {busy ? texts.submitting : texts.submit}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={formatMessage(texts.title, { number: round.roundNumber })}
    >
      <div className={styles.body}>
        <FeedbackResultProgress
          items={round.items}
          label={content.progress.label}
        />
        <ul aria-label={texts.countsLabel} className={styles.counts}>
          {FEEDBACK_ITEM_RESULT_VALUES.map((result) => (
            <li className={styles.count} data-result={result} key={result}>
              <FontAwesomeIcon
                aria-hidden="true"
                icon={FEEDBACK_ITEM_RESULT_BADGES[result].icon}
              />
              <span>{content.result.choices[result]}</span>
              <strong>
                {round.items.filter((item) => item.result === result).length}
              </strong>
            </li>
          ))}
        </ul>
        <p
          className={styles.check}
          data-ready={missing === 0 ? "true" : "false"}
        >
          {missing === 0
            ? formatMessage(texts.allRated, { total })
            : formatMessage(texts.missing, { count: missing, total })}
        </p>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
