import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";

/**
 * Error codes an owner of blocks answers with besides the kit's own, each mapped to the kit code
 * the block editor shows for it. The catalog has none.
 */
export type QuestionnaireOwnerErrorCodes = Readonly<
  Record<string, QuestionnaireErrorCode>
>;
