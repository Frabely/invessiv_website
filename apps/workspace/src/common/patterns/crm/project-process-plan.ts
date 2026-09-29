import { ProjectFieldLimits } from "@invessiv/common/constants/crm/forms/project-field-limits";
import {
  PROJECT_PHASE_SEQUENCE,
  ProjectPhase,
} from "@invessiv/common/constants/crm/project-phases";
import {
  normalizeFeedbackRoundPositions,
  sortFeedbackRoundPositions,
} from "@invessiv/common/patterns/crm/feedback-round-positions";
import { ProcessPlanMoveDirection } from "@/common/constants/crm/process-plan-move-directions";
import { ProcessPlanRowKind } from "@/common/constants/crm/process-plan-row-kinds";
import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";
import type { ProjectProcessPlanRow } from "@/common/contracts/crm/project-process-plan-row";

/**
 * The current step is stored as a label, and labels may repeat. It only changes once no step
 * carries it any more; otherwise renaming or removing a twin would move the current step.
 */
function keepCurrentStep(
  currentProcessStep: string,
  steps: readonly string[],
  fallback: string,
): string {
  return steps.includes(currentProcessStep) ? currentProcessStep : fallback;
}

type RowSlot =
  | { kind: typeof ProcessPlanRowKind.CustomStep; label: string }
  | { kind: typeof ProcessPlanRowKind.FeedbackRound };

/** New projects start with the phase labels; the feedback phase becomes two single rounds. */
export function createDefaultProcessPlan(
  phaseLabel: (phase: ProjectPhase) => string,
): ProjectProcessPlan {
  const steps = PROJECT_PHASE_SEQUENCE.filter(
    (phase) => phase !== ProjectPhase.Feedback,
  ).map(phaseLabel);
  const feedbackPosition = PROJECT_PHASE_SEQUENCE.indexOf(
    ProjectPhase.Feedback,
  );
  return {
    steps,
    feedbackRoundPositions: Array.from(
      { length: ProjectFieldLimits.DefaultFeedbackRoundCount },
      () => feedbackPosition,
    ),
    currentProcessStep: steps[0] ?? "",
  };
}

function toSlots(plan: ProjectProcessPlan): RowSlot[] {
  const positions = normalizeFeedbackRoundPositions(
    plan.feedbackRoundPositions,
    plan.steps.length,
  );
  const slots: RowSlot[] = [];
  let round = 0;
  for (let stepIndex = 0; stepIndex <= plan.steps.length; stepIndex += 1) {
    while (positions[round] === stepIndex) {
      slots.push({ kind: ProcessPlanRowKind.FeedbackRound });
      round += 1;
    }
    if (stepIndex < plan.steps.length)
      slots.push({
        kind: ProcessPlanRowKind.CustomStep,
        label: plan.steps[stepIndex]!,
      });
  }
  return slots;
}

/** A round's position is the number of free-text steps above it. */
function fromSlots(
  plan: ProjectProcessPlan,
  slots: readonly RowSlot[],
): ProjectProcessPlan {
  const steps: string[] = [];
  const feedbackRoundPositions: number[] = [];
  for (const slot of slots) {
    if (slot.kind === ProcessPlanRowKind.CustomStep) steps.push(slot.label);
    else feedbackRoundPositions.push(steps.length);
  }
  return { ...plan, steps, feedbackRoundPositions };
}

export function toProcessPlanRows(
  plan: ProjectProcessPlan,
): ProjectProcessPlanRow[] {
  let stepIndex = 0;
  let roundNumber = 0;
  return toSlots(plan).map((slot) => {
    if (slot.kind === ProcessPlanRowKind.FeedbackRound) {
      roundNumber += 1;
      return {
        kind: slot.kind,
        key: `round-${roundNumber}`,
        roundNumber,
      };
    }
    const row = {
      kind: slot.kind,
      key: `step-${stepIndex}`,
      stepIndex,
      label: slot.label,
    };
    stepIndex += 1;
    return row;
  });
}

export function insertFeedbackRoundAfter(
  plan: ProjectProcessPlan,
  rowIndex: number,
): ProjectProcessPlan {
  if (
    plan.feedbackRoundPositions.length >= ProjectFieldLimits.FeedbackRoundsMax
  )
    return plan;
  const slots = toSlots(plan);
  if (!(rowIndex in slots)) return plan;
  slots.splice(rowIndex + 1, 0, { kind: ProcessPlanRowKind.FeedbackRound });
  return fromSlots(plan, slots);
}

/** Round numbers follow the order, so removing round n renumbers the rounds after it. */
export function removeFeedbackRound(
  plan: ProjectProcessPlan,
  roundNumber: number,
): ProjectProcessPlan {
  const positions = sortFeedbackRoundPositions(plan.feedbackRoundPositions);
  if (roundNumber < 1 || roundNumber > positions.length) return plan;
  positions.splice(roundNumber - 1, 1);
  return { ...plan, feedbackRoundPositions: positions };
}

export function moveProcessPlanRow(
  plan: ProjectProcessPlan,
  rowIndex: number,
  direction: ProcessPlanMoveDirection,
): ProjectProcessPlan {
  const slots = toSlots(plan);
  const targetIndex =
    direction === ProcessPlanMoveDirection.Up ? rowIndex - 1 : rowIndex + 1;
  if (!(rowIndex in slots) || !(targetIndex in slots)) return plan;
  [slots[rowIndex], slots[targetIndex]] = [
    slots[targetIndex]!,
    slots[rowIndex]!,
  ];
  return fromSlots(plan, slots);
}

/** New steps go below everything, trailing rounds included, so the list reads in input order. */
export function addCustomStep(
  plan: ProjectProcessPlan,
  label: string,
): ProjectProcessPlan {
  const step = label.trim();
  if (!step) return plan;
  return { ...plan, steps: [...plan.steps, step] };
}

export function removeCustomStep(
  plan: ProjectProcessPlan,
  stepIndex: number,
): ProjectProcessPlan {
  if (plan.steps.length <= 1 || !(stepIndex in plan.steps)) return plan;
  let seen = -1;
  const slots = toSlots(plan).filter(
    (slot) =>
      slot.kind !== ProcessPlanRowKind.CustomStep || (seen += 1) !== stepIndex,
  );
  const next = fromSlots(plan, slots);
  return {
    ...next,
    currentProcessStep: keepCurrentStep(
      plan.currentProcessStep,
      next.steps,
      next.steps[0]!,
    ),
  };
}

export function renameCustomStep(
  plan: ProjectProcessPlan,
  stepIndex: number,
  label: string,
): ProjectProcessPlan {
  if (!(stepIndex in plan.steps)) return plan;
  const steps = plan.steps.map((step, index) =>
    index === stepIndex ? label : step,
  );
  return {
    ...plan,
    steps,
    currentProcessStep: keepCurrentStep(plan.currentProcessStep, steps, label),
  };
}
