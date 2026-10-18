/** The parts of an hours bar, in the order they are drawn from the left. */
export const HoursSegmentKind = {
  /** Used within what was assigned. */
  Used: "used",
  /** Used beyond what was assigned or bought. */
  Over: "over",
  /** Assigned to a project and not used yet. */
  Open: "open",
  /** Bought and not assigned to any project. */
  Free: "free",
} as const;

export type HoursSegmentKind =
  (typeof HoursSegmentKind)[keyof typeof HoursSegmentKind];

export const HOURS_SEGMENT_KIND_VALUES = [
  HoursSegmentKind.Used,
  HoursSegmentKind.Over,
  HoursSegmentKind.Open,
  HoursSegmentKind.Free,
] as const;
