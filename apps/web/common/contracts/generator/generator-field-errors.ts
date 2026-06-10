/**
 * Form fields that can carry an inline validation error in the anonymous
 * generation step.
 */
export type GeneratorFieldName = "topic" | "expertise" | "tone";

/** Map of generator field → inline error message (only set fields present). */
export type GeneratorFieldErrors = Partial<Record<GeneratorFieldName, string>>;
