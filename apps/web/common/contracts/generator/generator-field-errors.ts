import type { LeadCaptureFieldName } from "@/common/constants/generator/lead-capture-field-names";

/**
 * Form fields that can carry an inline validation error in the anonymous
 * generation step. Identity fields (name/email/consent) moved to the gated
 * lead-capture step — see LeadCaptureFieldErrors.
 */
export type GeneratorFieldName = "topic" | "expertise" | "tone";

/** Map of generator field → inline error message (only set fields present). */
export type GeneratorFieldErrors = Partial<Record<GeneratorFieldName, string>>;

/** Map of lead-capture field → inline error message (only set fields present). */
export type LeadCaptureFieldErrors = Partial<
  Record<LeadCaptureFieldName, string>
>;
