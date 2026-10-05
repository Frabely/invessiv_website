import { ProcessTrackItemKind } from "../../constants/crm/process-track-item-kinds";
import { ProcessStepTone } from "../../constants/ui/process-step-tones";
import { ProcessStepVariant } from "../../constants/ui/process-step-variants";
import type { ProjectProcessTrack } from "../../contracts/crm/project-process-track";
import type { ProjectProcessTrackStatusLabels } from "../../contracts/crm/project-process-track-status-labels";
import type { ProjectProcessTrackInput } from "../../contracts/crm/project-process-track-input";
import type { ProjectProcessTrackItem } from "../../contracts/crm/project-process-track-item";
import type { ProcessTrackStep } from "../../contracts/ui/process-track-step";
import { normalizeFeedbackRoundPositions } from "./feedback-round-positions";

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
  const positions = normalizeFeedbackRoundPositions(
    feedbackRoundPositions,
    processSteps.length,
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

/**
 * Project steps cannot be skipped, so the position to the current step is their whole state:
 * done before it, half way on it, empty after it. Only the running round carries the flag.
 */
export function toProcessTrackSteps(
  items: readonly ProjectProcessTrackItem[],
  currentIndex: number,
  statusLabels: ProjectProcessTrackStatusLabels,
): ProcessTrackStep[] {
  return items.map((item, index) => {
    const round = item.kind === ProcessTrackItemKind.FeedbackRound;
    const variant = round
      ? ProcessStepVariant.Accent
      : ProcessStepVariant.Default;
    if (index < currentIndex) {
      return {
        key: item.key,
        label: item.label,
        variant,
        ratio: 1,
        tone: ProcessStepTone.Success,
        valid: true,
        statusLabel: statusLabels.complete,
      };
    }
    if (index === currentIndex) {
      return {
        key: item.key,
        label: item.label,
        variant,
        ratio: 0.5,
        tone: ProcessStepTone.Info,
        valid: false,
        flagged: round ? true : undefined,
        statusLabel: round
          ? statusLabels.feedbackRunning
          : statusLabels.current,
      };
    }
    return {
      key: item.key,
      label: item.label,
      variant,
      ratio: 0,
      tone: ProcessStepTone.Neutral,
      valid: false,
      statusLabel: statusLabels.upcoming,
    };
  });
}
