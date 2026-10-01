import type { Locale } from "@invessiv/common";

/** One option as the field editor sends it; the list order becomes the position. */
export interface QuestionnaireChoiceInputDto {
  /** Identifies the option across saves, so a condition on it survives a relabel; fixed for yes/no and scale. */
  key: string;
  /** Label per locale; at least one is required. */
  labels: Partial<Record<Locale, string>>;
}
