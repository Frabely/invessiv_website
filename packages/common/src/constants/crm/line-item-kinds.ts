/**
 * What assigning a catalog entry does. `standard` only creates the project line item; the other
 * two also act on the project: `hours` credits and allocates the purchased time, `feedback_round`
 * adds one round step to the process track.
 */
export const LineItemKind = {
  Standard: "standard",
  Hours: "hours",
  FeedbackRound: "feedback_round",
} as const;

export type LineItemKind = (typeof LineItemKind)[keyof typeof LineItemKind];

export const LINE_ITEM_KIND_VALUES = [
  LineItemKind.Standard,
  LineItemKind.Hours,
  LineItemKind.FeedbackRound,
] as const;

/** Kinds whose effect happens with the assignment; their status, quantity and pricing mode stay fixed. */
export const AUTOMATED_LINE_ITEM_KIND_VALUES: readonly LineItemKind[] = [
  LineItemKind.Hours,
  LineItemKind.FeedbackRound,
];
