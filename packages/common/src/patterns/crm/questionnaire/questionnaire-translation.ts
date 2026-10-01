import { type Locale, SUPPORTED_LOCALES } from "@invessiv/common";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireResolvedText } from "../../../contracts/crm/questionnaire/questionnaire-resolved-text";

/**
 * Picks the preferred locale, otherwise the first maintained one in `SUPPORTED_LOCALES` order.
 * Null only when no locale is maintained, which the write path never lets happen.
 */
export function resolveQuestionnaireText<T>(
  translations: Partial<Record<Locale, T>>,
  preferred: Locale,
): QuestionnaireResolvedText<T> | null {
  for (const locale of [preferred, ...SUPPORTED_LOCALES]) {
    const text = translations[locale];
    if (text !== undefined)
      return { text, locale, isFallback: locale !== preferred };
  }
  return null;
}

function collectFieldLocales(
  field: QuestionnaireFieldDto,
  target: Locale[][],
): void {
  target.push(Object.keys(field.translations) as Locale[]);
  for (const choice of field.choices)
    target.push(Object.keys(choice.labels) as Locale[]);
  for (const child of field.children) collectFieldLocales(child, target);
}

/** Supported locales that the block, any field or any option lacks; feeds the language warning. */
export function missingQuestionnaireLocales(
  block: QuestionnaireBlockDto,
): Locale[] {
  const present: Locale[][] = [Object.keys(block.translations) as Locale[]];
  for (const field of block.fields) collectFieldLocales(field, present);
  return SUPPORTED_LOCALES.filter((locale) =>
    present.some((locales) => !locales.includes(locale)),
  );
}
