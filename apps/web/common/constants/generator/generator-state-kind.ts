/** Discriminant values for the generator preview state (see GeneratorState). */
export const GeneratorStateKind = {
  Idle: "idle",
  Loading: "loading",
  Success: "success",
  LimitReached: "limit_reached",
  Error: "error",
} as const;

export type GeneratorStateKind =
  (typeof GeneratorStateKind)[keyof typeof GeneratorStateKind];
