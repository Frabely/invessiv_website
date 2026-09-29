import type { ProcessTrackItemKind } from "../../constants/crm/process-track-item-kinds";

export interface ProjectProcessTrackItem {
  /** Stable React key within one track. */
  key: string;
  /** Visible step label; a free-text step or the localized round label. */
  label: string;
  /** Free-text step or one round of the feedback block. */
  kind: ProcessTrackItemKind;
  /** Round number for feedback rounds; absent for free-text steps. */
  roundNumber?: number;
}
