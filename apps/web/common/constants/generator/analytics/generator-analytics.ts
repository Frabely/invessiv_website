export const GeneratorErrorReason = {
  Network: "network",
  Validation: "validation",
} as const;

export type GeneratorErrorReason =
  (typeof GeneratorErrorReason)[keyof typeof GeneratorErrorReason];
