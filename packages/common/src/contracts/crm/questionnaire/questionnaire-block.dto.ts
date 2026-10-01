import type { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { Locale } from "@invessiv/common";
import type { QuestionnaireBlockTranslationDto } from "./questionnaire-block-translation.dto";
import type { QuestionnaireFieldDto } from "./questionnaire-field.dto";

/** A building block: a catalog entry or the snapshot copy owned by exactly one form. */
export interface QuestionnaireBlockDto {
  /** Block id; a copy has its own id, never the catalog block's. */
  id: string;
  /** Internal key such as `company_profile`; unique among catalog blocks, copies keep it. */
  key: string;
  /** Company-wide content that a follow-up project pre-fills from the last completed form. */
  carryOver: boolean;
  /** Only catalog blocks are ever archived; blocks of a form are always active. */
  status: QuestionnaireCatalogStatus;
  /** Catalog block this copy was taken from; matches blocks across forms for the pre-fill. Null for catalog blocks or once the origin was deleted. */
  sourceBlockId: string | null;
  /** Texts per maintained locale; at least one exists. */
  translations: Partial<Record<Locale, QuestionnaireBlockTranslationDto>>;
  /** Block-level fields in display order; group sub-fields sit in `children`. */
  fields: QuestionnaireFieldDto[];
  /** Optimistic-concurrency counter of the block row. */
  version: number;
}
