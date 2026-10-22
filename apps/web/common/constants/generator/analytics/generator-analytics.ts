export const GeneratorErrorReason = {
  Network: "network",
} as const;

export type GeneratorErrorReason =
  (typeof GeneratorErrorReason)[keyof typeof GeneratorErrorReason];
