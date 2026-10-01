import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/** One option in the field dialog; `keyEdited` stops the key from following the first label. */
export type QuestionnaireChoiceFormValues = {
  key: string;
  keyEdited: boolean;
  labels: Record<Locale, string>;
};
