/** Edge marker of a status row; the consumer maps its own state onto it, the row only styles it. */
export const StatusRowTone = {
  Default: "default",
  Attention: "attention",
  Muted: "muted",
} as const;

export type StatusRowTone = (typeof StatusRowTone)[keyof typeof StatusRowTone];

export const STATUS_ROW_TONE_VALUES = [
  StatusRowTone.Default,
  StatusRowTone.Attention,
  StatusRowTone.Muted,
] as const;
