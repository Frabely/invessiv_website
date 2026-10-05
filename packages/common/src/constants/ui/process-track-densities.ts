/** How much room a track takes: `compact` drops its own frame and keeps every label on one line. */
export const ProcessTrackDensity = {
  Default: "default",
  Compact: "compact",
} as const;

export type ProcessTrackDensity =
  (typeof ProcessTrackDensity)[keyof typeof ProcessTrackDensity];

export const PROCESS_TRACK_DENSITY_VALUES = [
  ProcessTrackDensity.Default,
  ProcessTrackDensity.Compact,
] as const;
