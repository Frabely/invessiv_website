import type { QuestionnaireBlockSummaryDto } from "./questionnaire-block-summary.dto";

/** The catalog block list after filtering. */
export interface QuestionnaireBlockListDto {
  /** Whether the catalog holds any block at all; tells "nothing yet" from "no match". */
  hasBlocks: boolean;
  /** Matching blocks, newest first. */
  rows: QuestionnaireBlockSummaryDto[];
}
