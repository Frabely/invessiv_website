import type { ProcessStepProgress } from "../../constants/ui/process-step-progress";
import type { ProcessStepVariant } from "../../constants/ui/process-step-variants";

export interface ProcessTrackStep {
  /** Stable key within the track; labels may repeat. */
  key: string;
  /** Visible step label. */
  label: string;
  /** Visual emphasis; `accent` groups related steps without carrying domain meaning. */
  variant?: ProcessStepVariant;
  /** Own progress of the step; set it when steps can be skipped, so a passed step is not ticked off by position. */
  progress?: ProcessStepProgress;
}
