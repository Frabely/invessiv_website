import type { ProcessStepVariant } from "../../constants/ui/process-step-variants";

export interface ProcessTrackStep {
  /** Stable key within the track; labels may repeat. */
  key: string;
  /** Visible step label. */
  label: string;
  /** Visual emphasis; `accent` groups related steps without carrying domain meaning. */
  variant?: ProcessStepVariant;
}
