/**
 * View status of a single generation step in the in-generator loading panel.
 * Const-object + derived type per project convention.
 */
export const GeneratorStepStatus = {
  Done: "done",
  Active: "active",
  Pending: "pending",
} as const;

export type GeneratorStepStatus =
  (typeof GeneratorStepStatus)[keyof typeof GeneratorStepStatus];
