import type { HoursSegmentKind } from "@invessiv/common/constants/time/hours-segment-kinds";

/** One part of an hours bar; its width is its share of all segments of the bar. */
export type HoursMeterSegment = {
  kind: HoursSegmentKind;
  minutes: number;
};
