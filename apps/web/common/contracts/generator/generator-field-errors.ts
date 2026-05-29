/** Form fields that can carry an inline validation error in the generator. */
export type GeneratorFieldName =
  | "topic"
  | "expertise"
  | "tone"
  | "email"
  | "consent";

/** Map of generator field → inline error message (only set fields present). */
export type GeneratorFieldErrors = Partial<Record<GeneratorFieldName, string>>;
