import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { QuestionnaireSaveOutcomeKind } from "@/common/constants/crm/questionnaire/questionnaire-save-outcome-kinds";

/** What an inline editor of the kit shows after a save; null while nothing was saved or edited since. */
export type QuestionnaireSaveOutcome =
  | { kind: typeof QuestionnaireSaveOutcomeKind.Saved }
  | { kind: typeof QuestionnaireSaveOutcomeKind.Conflict }
  | {
      kind: typeof QuestionnaireSaveOutcomeKind.Failure;
      code: QuestionnaireErrorCode;
    }
  | null;
