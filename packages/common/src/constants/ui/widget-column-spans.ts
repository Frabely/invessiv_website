export const WidgetColumnSpan = {
  Four: 4,
  Six: 6,
  Eight: 8,
  Full: 12,
} as const;

export type WidgetColumnSpan =
  (typeof WidgetColumnSpan)[keyof typeof WidgetColumnSpan];
