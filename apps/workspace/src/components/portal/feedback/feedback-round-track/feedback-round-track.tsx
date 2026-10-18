"use client";

import {
  FeedbackRoundStatus,
  type FeedbackRoundStatus as FeedbackRoundStatusValue,
} from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ProcessStepTone } from "@invessiv/common/constants/ui/process-step-tones";
import { ProcessTrackDensity } from "@invessiv/common/constants/ui/process-track-densities";
import type { ProcessTrackStep } from "@invessiv/common/contracts/ui/process-track-step";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ProcessTrack } from "@invessiv/ui";
import { FeedbackRoundStepKind } from "@/common/constants/portal/feedback-round-step-kinds";
import type { FeedbackRoundStepEntry } from "@/common/contracts/portal/feedback-round-step-entry";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";

// The fill follows the round through its life: handed over, submitted, being implemented, done.
const RATIOS: Record<FeedbackRoundStatusValue, number> = {
  [FeedbackRoundStatus.Open]: 0.25,
  [FeedbackRoundStatus.Submitted]: 0.5,
  [FeedbackRoundStatus.InDiscussion]: 0.5,
  [FeedbackRoundStatus.InProgress]: 0.75,
  [FeedbackRoundStatus.Completed]: 1,
  [FeedbackRoundStatus.Approved]: 1,
};

export type FeedbackRoundTrackProps = {
  content: PortalFeedbackDictionary;
  /** Number of the round shown; null while none was handed over. */
  current: number | null;
  entries: readonly FeedbackRoundStepEntry[];
  onSelectAction: (roundNumber: number) => void;
};

/**
 * Every round of the project as a step, the same track as in the onboarding form. Rounds that were
 * handed over can be opened; rounds still to come or dropped after the approval stay visible but
 * closed, so the customer always sees how many rounds there are and which one runs.
 */
export function FeedbackRoundTrack({
  content,
  current,
  entries,
  onSelectAction,
}: FeedbackRoundTrackProps) {
  const steps = entries.map((entry): ProcessTrackStep => {
    const label = formatMessage(content.steps.round, {
      number: entry.roundNumber,
    });
    if (entry.kind !== FeedbackRoundStepKind.Round)
      return {
        key: String(entry.roundNumber),
        label,
        ratio: 0,
        tone: ProcessStepTone.Neutral,
        disabled: true,
        statusLabel:
          entry.kind === FeedbackRoundStepKind.Expired
            ? content.steps.expired
            : content.steps.upcoming,
      };
    const { status, customerNotice } = entry.round;
    const done =
      status === FeedbackRoundStatus.Completed ||
      status === FeedbackRoundStatus.Approved;
    return {
      key: String(entry.roundNumber),
      label,
      ratio: RATIOS[status],
      tone: done ? ProcessStepTone.Success : ProcessStepTone.Info,
      valid: done,
      // A round handed back or held for a call carries a message from the team.
      flagged:
        status === FeedbackRoundStatus.InDiscussion ||
        (status === FeedbackRoundStatus.Open && customerNotice !== null),
      statusLabel: content.status[status],
    };
  });

  return (
    <ProcessTrack
      currentIndex={entries.findIndex((entry) => entry.roundNumber === current)}
      density={ProcessTrackDensity.Compact}
      label={content.steps.label}
      onStepAction={(_label, index) =>
        onSelectAction(entries[index].roundNumber)
      }
      steps={steps}
    />
  );
}
