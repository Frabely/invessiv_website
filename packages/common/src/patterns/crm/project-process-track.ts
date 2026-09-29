import { ProcessTrackItemKind } from "../../constants/crm/process-track-item-kinds";
import { ProcessStepVariant } from "../../constants/ui/process-step-variants";
import type { ProjectProcessTrack } from "../../contracts/crm/project-process-track";
import type { ProjectProcessTrackInput } from "../../contracts/crm/project-process-track-input";
import type { ProjectProcessTrackItem } from "../../contracts/crm/project-process-track-item";
import type { ProcessTrackStep } from "../../contracts/ui/process-track-step";
import { sortFeedbackRoundPositions } from "./sort-feedback-round-positions";

/**
 * Feedback rounds are the only steps with logic; free-text steps are plain labels, even one called
 * "Feedback". A running round is current; otherwise the current free-text step decides, but never
 * before the last completed round.
 */
export function buildProjectProcessTrack({
  processSteps,
  currentProcessStep,
  feedbackRoundPositions,
  roundProgress,
  roundLabel,
}: ProjectProcessTrackInput): ProjectProcessTrack {
  const approvedRound = roundProgress?.approvedRoundNumber ?? null;
  const positions = sortFeedbackRoundPositions(
    feedbackRoundPositions.map((position) =>
      Math.min(Math.max(position, 0), processSteps.length),
    ),
  ).slice(0, approvedRound ?? undefined);

  const items: ProjectProcessTrackItem[] = [];
  const stepItemIndex: number[] = [];
  const roundItemIndex: number[] = [];
  let roundNumber = 0;
  for (let stepIndex = 0; stepIndex <= processSteps.length; stepIndex += 1) {
    while (positions[roundNumber] === stepIndex) {
      roundNumber += 1;
      roundItemIndex[roundNumber] = items.length;
      items.push({
        key: `feedback-round-${roundNumber}`,
        label: roundLabel(roundNumber),
        kind: ProcessTrackItemKind.FeedbackRound,
        roundNumber,
      });
    }
    if (stepIndex === processSteps.length) break;
    stepItemIndex[stepIndex] = items.length;
    items.push({
      key: `step-${stepIndex}`,
      label: processSteps[stepIndex]!,
      kind: ProcessTrackItemKind.Custom,
    });
  }

  const activeRound = roundProgress?.activeRoundNumber ?? null;
  const activeIndex =
    approvedRound === null && activeRound !== null
      ? roundItemIndex[activeRound]
      : undefined;
  if (activeIndex !== undefined) return { items, currentIndex: activeIndex };

  const stepIndex = processSteps.indexOf(currentProcessStep);
  const mappedIndex = stepIndex < 0 ? -1 : stepItemIndex[stepIndex]!;
  const doneRound =
    approvedRound ?? roundProgress?.completedRoundNumber ?? null;
  const doneIndex = doneRound === null ? undefined : roundItemIndex[doneRound];
  return {
    items,
    currentIndex:
      doneIndex === undefined
        ? mappedIndex
        : Math.max(mappedIndex, doneIndex + 1),
  };
}

export function toProcessTrackSteps(
  items: readonly ProjectProcessTrackItem[],
): ProcessTrackStep[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    variant:
      item.kind === ProcessTrackItemKind.FeedbackRound
        ? ProcessStepVariant.Accent
        : ProcessStepVariant.Default,
  }));
}
