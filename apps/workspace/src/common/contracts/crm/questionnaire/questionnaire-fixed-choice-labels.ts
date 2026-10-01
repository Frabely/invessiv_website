import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/** Default labels of the fixed yes/no options per locale, read from every locale's dictionary. */
export type QuestionnaireFixedChoiceLabels = Record<
  Locale,
  { yes: string; no: string }
>;
