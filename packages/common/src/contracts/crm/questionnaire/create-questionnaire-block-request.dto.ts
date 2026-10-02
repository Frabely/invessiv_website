import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { QuestionnaireBlockTranslationDto } from "./questionnaire-block-translation.dto";

/** Creates an empty catalog block; fields follow in the block editor. */
export interface CreateQuestionnaireBlockRequestDto {
  /** Internal key, unique among catalog blocks; the dialog suggests it from the title. */
  key: string;
  /** Company-wide content that a follow-up project pre-fills from the last completed form. */
  carryOver: boolean;
  /** Texts per locale; the dialog sends the editor's own locale, at least one is required. */
  translations: Partial<Record<Locale, QuestionnaireBlockTranslationDto>>;
}
