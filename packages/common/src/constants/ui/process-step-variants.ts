export const ProcessStepVariant = {
  Default: "default",
  Accent: "accent",
} as const;

export type ProcessStepVariant =
  (typeof ProcessStepVariant)[keyof typeof ProcessStepVariant];
