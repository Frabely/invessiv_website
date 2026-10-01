import "server-only";

import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";

/**
 * Yes/no labels in every content locale, so a new yes/no field starts complete in all languages
 * instead of only in the language of the person editing it.
 */
export function buildQuestionnaireFixedChoiceLabels(): QuestionnaireFixedChoiceLabels {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      getCrmQuestionnaireDictionary(locale).editor.choices.defaults,
    ]),
  ) as QuestionnaireFixedChoiceLabels;
}
