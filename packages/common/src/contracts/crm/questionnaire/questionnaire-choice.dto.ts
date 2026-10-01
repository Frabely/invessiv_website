import type { Locale } from "@invessiv/common";

/** One option of a choice, yes/no or scale field. */
export interface QuestionnaireChoiceDto {
  /** Choice id; answers and conditions reference this value, never the label. */
  id: string;
  /** Stable internal key; fixed to `yes`/`no` or `low`/`high` for those types. */
  key: string;
  /** Display order within the field, starting at 0. */
  position: number;
  /** Label per maintained locale; at least one exists, missing ones fall back via `resolveQuestionnaireText`. */
  labels: Partial<Record<Locale, string>>;
  /** Optimistic-concurrency counter of the choice row. */
  version: number;
}
