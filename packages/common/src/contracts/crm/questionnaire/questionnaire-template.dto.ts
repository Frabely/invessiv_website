import type { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { QuestionnaireTemplateBlockDto } from "./questionnaire-template-block.dto";

/** An ordered selection of catalog blocks that a form starts from. */
export interface QuestionnaireTemplateDto {
  /** Template id; a form keeps it only as its origin. */
  id: string;
  /** Internal name such as "Landingpage kompakt"; never shown to customers, therefore not translated. */
  title: string;
  /** Internal note on when to use the template; null when left empty. */
  description: string | null;
  /** Archived templates drop out of the picker when starting a form. */
  status: QuestionnaireCatalogStatus;
  /** Blocks in template order. */
  blocks: QuestionnaireTemplateBlockDto[];
  /** Optimistic-concurrency counter; every update request must echo the value it read. */
  version: number;
}
