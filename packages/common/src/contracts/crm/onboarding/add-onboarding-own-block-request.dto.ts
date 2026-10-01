import type { Locale } from "@invessiv/common";
import type { QuestionnaireBlockTranslationDto } from "../questionnaire/questionnaire-block-translation.dto";

/** Appends an empty block that exists only in this form; it has no origin and is never pre-filled. */
export interface AddOnboardingOwnBlockRequestDto {
  /** Internal key, unique among the blocks of the form. */
  key: string;
  /** Texts per locale; the dialog sends the editor's own locale, at least one is required. */
  translations: Partial<Record<Locale, QuestionnaireBlockTranslationDto>>;
  /** Form version the client last read; a stale value answers with a 409 and the current form. */
  expectedFormVersion: number;
}
