import type { ProcessStepProgress } from "../../constants/ui/process-step-progress";
import type { ProcessStepTone } from "../../constants/ui/process-step-tones";
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
  /** Share of the step that is done, 0 to 1. Fills the segment that far and replaces `progress` and the position. */
  ratio?: number;
  /** Colour of the fill when `ratio` is set; neutral without it. */
  tone?: ProcessStepTone;
  /** Short counter next to the label, e.g. "3/10". */
  detail?: string;
  /** The state in words for screen readers, since tone and icon are not read out. */
  statusLabel?: string;
  /** Ticks the step off as acceptable as it is, even while its fill is not full. Only read together with `ratio`. */
  valid?: boolean;
}
