import type { ProjectProcessTrackItem } from "./project-process-track-item";

export interface ProjectProcessTrack {
  /** Free-text steps with the feedback rounds inserted at the block position. */
  items: ProjectProcessTrackItem[];
  /** Index of the current item; -1 when the current step is unknown, `items.length` when all are done. */
  currentIndex: number;
}
