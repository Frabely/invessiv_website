import type { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { QuestionnaireBlockTranslationDto } from "./questionnaire-block-translation.dto";

/** Replaces the head of a block; fields are written through their own requests. */
export interface UpdateQuestionnaireBlockRequestDto {
  /** Internal key; unique among catalog blocks, copies in forms keep theirs. */
  key: string;
  /** Company-wide content that a follow-up project pre-fills from the last completed form. */
  carryOver: boolean;
  /** Archiving is only possible for catalog blocks; a form's block stays active. */
  status: QuestionnaireCatalogStatus;
  /** Replaces every stored locale; a locale left out is deleted, at least one must remain. */
  translations: Partial<Record<Locale, QuestionnaireBlockTranslationDto>>;
  /** Block version the client last read; a stale value answers with a 409 and the current block. */
  version: number;
}
