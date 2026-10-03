"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRotateLeft,
  faCircleCheck,
  faComments,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  FeedbackRoundStatus,
  INTERNAL_FEEDBACK_ROUND_TARGET_STATUS_VALUES,
  type InternalFeedbackRoundTargetStatus,
} from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FeedbackTransitionSide } from "@invessiv/common/constants/crm/feedback-transition-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import { canTransition } from "@invessiv/common/patterns/crm/feedback-round-state";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";
import { FeedbackProcessingError } from "@/common/constants/feedback/feedback-processing-errors";
import { feedbackProcessingError } from "@/common/patterns/crm/feedback-processing-error";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackCompleteDialog } from "../feedback-complete-dialog/feedback-complete-dialog";
import { FeedbackTextDialog } from "../feedback-text-dialog/feedback-text-dialog";
import styles from "./feedback-round-status-actions.module.css";

type FeedbackRoundStatusActionsProps = {
  content: CrmFeedbackRoundsDictionary;
  round: FeedbackRoundDto;
  included: number;
  processSteps: readonly string[];
  feedbackRoundPositions: readonly number[];
  onAnnounceAction: (message: string) => void;
  onHandOverNextAction: () => void;
};

const ACTION_ICONS: Record<InternalFeedbackRoundTargetStatus, IconDefinition> =
  {
    in_discussion: faComments,
    in_progress: faScrewdriverWrench,
    open: faArrowRotateLeft,
    completed: faCircleCheck,
  };

// Moving the work forward is the main path; a call or a handback are the detours.
const PRIMARY_TARGETS: readonly InternalFeedbackRoundTargetStatus[] = [
  FeedbackRoundStatus.InProgress,
  FeedbackRoundStatus.Completed,
];

/**
 * The team's next steps on a round. Only steps `FEEDBACK_ROUND_TRANSITIONS` allows from the current
 * status appear; the server checks the same table again.
 */
export function FeedbackRoundStatusActions({
  content,
  round,
  included,
  processSteps,
  feedbackRoundPositions,
  onAnnounceAction,
  onHandOverNextAction,
}: FeedbackRoundStatusActionsProps) {
  const router = useRouter();
  const texts = content.actions;
  const [dialog, setDialog] =
    useState<InternalFeedbackRoundTargetStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targets = INTERNAL_FEEDBACK_ROUND_TARGET_STATUS_VALUES.filter(
    (target) =>
      canTransition(round.status, target, FeedbackTransitionSide.Internal),
  );

  function announce(status: FeedbackRoundDto["status"]) {
    onAnnounceAction(
      formatMessage(content.announcements.statusChanged, {
        number: round.roundNumber,
        status: content.status[status],
      }),
    );
  }

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await feedbackRoundsApiService.changeStatus(round.id, {
      version: round.version,
      to: FeedbackRoundStatus.InProgress,
    });
    setBusy(false);
    if (result.ok) announce(result.value.status);
    else
      setError(
        content.processingErrors[
          result.code === ConcurrencyErrorCode.VersionConflict
            ? FeedbackProcessingError.Changed
            : feedbackProcessingError(result.code)
        ],
      );
    router.refresh();
  }

  function open(target: InternalFeedbackRoundTargetStatus) {
    setError(null);
    if (target === FeedbackRoundStatus.InProgress) void start();
    else setDialog(target);
  }

  if (targets.length === 0 && dialog === null) return null;

  return (
    <div className={styles.actions}>
      {targets.length > 0 ? (
        <div
          aria-label={texts.groupLabel}
          className={styles.buttons}
          role="group"
        >
          {targets.map((target) => {
            const label = (
              <>
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={ACTION_ICONS[target]}
                />
                {busy && target === FeedbackRoundStatus.InProgress
                  ? texts.starting
                  : texts[target]}
              </>
            );
            return PRIMARY_TARGETS.includes(target) ? (
              <PrimaryCtaButton
                disabled={busy}
                key={target}
                onClick={() => open(target)}
                type="button"
              >
                {label}
              </PrimaryCtaButton>
            ) : (
              <ButtonControl
                disabled={busy}
                key={target}
                onClick={() => open(target)}
                type="button"
                variant="ghost"
              >
                {label}
              </ButtonControl>
            );
          })}
        </div>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {dialog === FeedbackRoundStatus.InDiscussion ||
      dialog === FeedbackRoundStatus.Open ? (
        <FeedbackTextDialog<FeedbackRoundDto>
          common={content.textDialog}
          errorMessage={(code) =>
            content.processingErrors[feedbackProcessingError(code)]
          }
          initial={round}
          onCloseAction={() => setDialog(null)}
          onSavedAction={(changed) => announce(changed.status)}
          required={dialog === FeedbackRoundStatus.Open}
          send={(current, notice) =>
            dialog === FeedbackRoundStatus.Open
              ? feedbackRoundsApiService.changeStatus(current.id, {
                  version: current.version,
                  to: FeedbackRoundStatus.Open,
                  customerNotice: notice,
                })
              : feedbackRoundsApiService.changeStatus(current.id, {
                  version: current.version,
                  to: FeedbackRoundStatus.InDiscussion,
                  customerNotice: notice || null,
                })
          }
          texts={
            dialog === FeedbackRoundStatus.Open
              ? content.notice.return
              : content.notice.discussion
          }
        />
      ) : null}
      {dialog === FeedbackRoundStatus.Completed ? (
        <FeedbackCompleteDialog
          content={content}
          included={included}
          processSteps={processSteps}
          feedbackRoundPositions={feedbackRoundPositions}
          onCloseAction={() => setDialog(null)}
          onCompletedAction={(changed) => {
            announce(changed.status);
            router.refresh();
          }}
          onHandOverNextAction={onHandOverNextAction}
          round={round}
        />
      ) : null}
    </div>
  );
}
