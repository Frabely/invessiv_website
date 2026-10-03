import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";

/** Every write on a block answers with the whole block, so order and conditions come from one source. */
export type QuestionnaireBlockResult =
  QuestionnaireCommandResult<QuestionnaireBlockDto>;

/** A locked block at the expected version, or the answer that explains why it is not. */
export type OpenedQuestionnaireBlock =
  | { ok: true; block: QuestionnaireBlockDto }
  | { ok: false; result: QuestionnaireBlockResult };
