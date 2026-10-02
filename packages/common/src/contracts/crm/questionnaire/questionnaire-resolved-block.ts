import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { QuestionnaireResolvedField } from "./questionnaire-resolved-field";

/** A block with its texts resolved for a reader, as form and read view show it. */
export interface QuestionnaireResolvedBlock {
  /** Block id; steps and conditions reference this value. */
  id: string;
  /** Step title in the requested locale, or in the first maintained one. */
  title: string;
  /** Hint above the fields; null when the block needs none. */
  intro: string | null;
  /** Locale some text of the block fell back to; null when everything exists in the requested one. */
  fallbackLocale: Locale | null;
  /** Block-level fields in display order; group sub-fields sit in `children`. */
  fields: QuestionnaireResolvedField[];
}
