import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";

/** The label in the interface language or its fallback; `untitled` only for a field without text. */
export function questionnaireFieldName(
  field: Pick<QuestionnaireFieldDto, "translations">,
  locale: Locale,
  untitled: string,
): string {
  return (
    resolveQuestionnaireText(field.translations, locale)?.text.label ?? untitled
  );
}

/** The block title in the interface language or its fallback, else the key. */
export function questionnaireBlockName(
  block: Pick<QuestionnaireBlockDto, "translations" | "key">,
  locale: Locale,
): string {
  return (
    resolveQuestionnaireText(block.translations, locale)?.text.title ??
    block.key
  );
}
