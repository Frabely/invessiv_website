import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";

/** A 409 carries the current aggregate, so an editor adopts it and keeps its input. */
export type QuestionnaireClientResult<T> = VersionedJsonMutationResult<
  T,
  QuestionnaireErrorCode
>;
