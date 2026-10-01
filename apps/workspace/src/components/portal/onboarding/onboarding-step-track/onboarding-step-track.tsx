"use client";

import { ProcessStepProgress } from "@invessiv/common/constants/ui/process-step-progress";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireCompleteness } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { ProcessTrack } from "@invessiv/ui";
import { PORTAL_ONBOARDING_REVIEW_SECTION } from "@/common/constants/portal/portal-onboarding-query-params";
import { onboardingStepProgress } from "@/common/patterns/portal/onboarding-step-progress";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";

export type OnboardingStepTrackProps = {
  blocks: readonly PortalOnboardingBlockDto[];
  completeness: QuestionnaireCompleteness;
  content: PortalOnboardingDictionary;
  /** Block id of the open step, or the review section. */
  current: string;
  /** The live state of the form: answers, files and group entries all count as work on a step. */
  input: Pick<
    QuestionnaireCompletenessInput,
    "answers" | "answerFiles" | "groupEntries"
  >;
  onSelectAction: (section: string) => void;
};

/**
 * Every block as a step, then the review. Steps can be visited in any order and left unfinished,
 * so each one shows its own progress instead of a tick for having been passed.
 */
export function OnboardingStepTrack({
  blocks,
  completeness,
  content,
  current,
  input,
  onSelectAction,
}: OnboardingStepTrackProps) {
  const answered = new Set(
    [...input.answers, ...input.answerFiles, ...input.groupEntries].map(
      (entry) => entry.fieldId,
    ),
  );
  const steps = [
    ...blocks.map((block) => {
      const progress = completeness.blocks.find(
        (entry) => entry.blockId === block.id,
      ) ?? { answeredRequired: 0, totalRequired: 0 };
      return {
        key: block.id,
        label: block.title,
        progress: onboardingStepProgress(
          progress,
          flattenQuestionnaireFields(block.fields).some((field) =>
            answered.has(field.id),
          ),
        ),
      };
    }),
    {
      key: PORTAL_ONBOARDING_REVIEW_SECTION,
      label: content.steps.review,
      progress: ProcessStepProgress.Empty,
    },
  ];

  return (
    <ProcessTrack
      currentIndex={steps.findIndex((step) => step.key === current)}
      label={content.steps.label}
      onStepAction={(_label, index) => onSelectAction(steps[index].key)}
      steps={steps}
      summary={
        <OnboardingProgressBar
          progress={completeness}
          texts={content.progress}
        />
      }
    />
  );
}
