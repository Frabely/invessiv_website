"use client";

import { ProcessStepTone } from "@invessiv/common/constants/ui/process-step-tones";
import { ProcessTrackDensity } from "@invessiv/common/constants/ui/process-track-densities";
import type { QuestionnaireCompleteness } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import type { ProcessTrackStep } from "@invessiv/common/contracts/ui/process-track-step";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ProcessTrack } from "@invessiv/ui";
import { OnboardingStepStatusKind } from "@/common/constants/portal/onboarding-step-status-kinds";
import { PORTAL_ONBOARDING_REVIEW_SECTION } from "@/common/constants/portal/portal-onboarding-query-params";
import { onboardingStepProgress } from "@/common/patterns/portal/onboarding-step-progress";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";

const TONES: Record<OnboardingStepStatusKind, ProcessStepTone> = {
  [OnboardingStepStatusKind.Untouched]: ProcessStepTone.Neutral,
  [OnboardingStepStatusKind.Incomplete]: ProcessStepTone.Info,
  [OnboardingStepStatusKind.Complete]: ProcessStepTone.Success,
  [OnboardingStepStatusKind.Attention]: ProcessStepTone.Danger,
};

export type OnboardingStepTrackProps = {
  blocks: readonly PortalOnboardingBlockDto[];
  completeness: QuestionnaireCompleteness;
  content: PortalOnboardingDictionary;
  /** Block id of the open step, or the review section. */
  current: string;
  /** Blocks holding a visible input that cannot be saved as it is. */
  invalidBlockIds: ReadonlySet<string>;
  /** Sections visited and left in the current editor session. */
  leftSections: ReadonlySet<string>;
  onSelectAction: (section: string) => void;
  /** Blocks the team sent back with a question; empty outside a change request. */
  requestedBlockIds: ReadonlySet<string>;
};

/**
 * Every block as a step, then the review. Steps can be visited in any order and left unfinished,
 * so each one shows how much of it is answered and whether it could be submitted as it is.
 */
export function OnboardingStepTrack({
  blocks,
  completeness,
  content,
  current,
  invalidBlockIds,
  leftSections,
  onSelectAction,
  requestedBlockIds,
}: OnboardingStepTrackProps) {
  const texts = content.steps;
  const invalid = invalidBlockIds.size > 0;
  const ready = completeness.missing.length === 0 && !invalid;
  const steps: ProcessTrackStep[] = [
    ...blocks.map((block) => {
      const progress = completeness.blocks.find(
        (entry) => entry.blockId === block.id,
      ) ?? { answeredRequired: 0, totalRequired: 0, answered: 0, total: 0 };
      const status = onboardingStepProgress(progress, {
        current: block.id === current,
        invalid: invalidBlockIds.has(block.id),
        left: leftSections.has(block.id),
      });
      const statusText = texts.status[status.kind];
      const statusLabel =
        status.valid && status.kind !== OnboardingStepStatusKind.Complete
          ? formatMessage(texts.statusValid, { status: statusText })
          : statusText;
      const requested = requestedBlockIds.has(block.id);
      return {
        key: block.id,
        label: block.title,
        ratio: status.ratio,
        tone: TONES[status.kind],
        valid: status.valid,
        flagged: requested,
        detail:
          progress.total > 0
            ? `${progress.answered}/${progress.total}`
            : undefined,
        statusLabel: requested
          ? formatMessage(texts.statusRequested, { status: statusLabel })
          : statusLabel,
      };
    }),
    // Optional invalid input also prevents submission, even when nothing required is missing.
    {
      key: PORTAL_ONBOARDING_REVIEW_SECTION,
      label: texts.review,
      ratio: ready ? 1 : 0,
      tone: invalid
        ? ProcessStepTone.Danger
        : ready
          ? ProcessStepTone.Success
          : ProcessStepTone.Neutral,
      valid: ready,
      statusLabel: invalid
        ? texts.status.attention
        : ready
          ? texts.status.complete
          : texts.status.incomplete,
    },
  ];

  return (
    <ProcessTrack
      currentIndex={steps.findIndex((step) => step.key === current)}
      density={ProcessTrackDensity.Compact}
      label={texts.label}
      onStepAction={(_label, index) => onSelectAction(steps[index].key)}
      steps={steps}
    />
  );
}
