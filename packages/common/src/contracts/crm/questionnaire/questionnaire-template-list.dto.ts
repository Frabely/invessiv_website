import type { QuestionnaireTemplateSummaryDto } from "./questionnaire-template-summary.dto";

/** The template list after filtering. */
export interface QuestionnaireTemplateListDto {
  /** Whether any template exists at all; tells "nothing yet" from "no match". */
  hasTemplates: boolean;
  /** Matching templates, most recently changed first. */
  rows: QuestionnaireTemplateSummaryDto[];
}
