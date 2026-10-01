import type { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { Locale } from "@invessiv/common";

/** A catalog block as the list and the block picker show it. */
export interface QuestionnaireBlockSummaryDto {
  /** Catalog block id; the editor page addresses this value. */
  id: string;
  /** Internal key, shown to tell blocks with similar titles apart. */
  key: string;
  /** Titles per maintained locale; the list resolves one via `resolveQuestionnaireText`. */
  titles: Partial<Record<Locale, string>>;
  /** Company-wide content that a follow-up project pre-fills. */
  carryOver: boolean;
  /** Archived blocks stay listed but drop out of the template picker. */
  status: QuestionnaireCatalogStatus;
  /** Number of fields including group sub-fields. */
  fieldCount: number;
  /** Supported locales that the block, a field or an option lacks (`missingQuestionnaireLocales`). */
  missingLocales: Locale[];
  /** Number of templates using the block; a used block can be archived but not deleted. */
  templateCount: number;
}
