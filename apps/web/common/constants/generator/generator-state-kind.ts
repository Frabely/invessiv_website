/** Discriminant values for the generator preview state (see GeneratorState). */
export const GeneratorStateKind = {
  Idle: "idle",
  Loading: "loading",
  Success: "success",
  Error: "error",
} as const;

export type GeneratorStateKind =
  (typeof GeneratorStateKind)[keyof typeof GeneratorStateKind];
