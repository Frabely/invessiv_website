import type { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";

/** Replaces head and block selection of a template in one write. */
export interface UpdateQuestionnaireTemplateRequestDto {
  /** Internal name; not translated because customers never see it. */
  title: string;
  /** Internal note on when to use the template; null or blank leaves it out. */
  description: string | null;
  /** Archived templates are not offered when a form is started. */
  status: QuestionnaireCatalogStatus;
  /** Catalog block ids in template order; each once, and a newly added block must be active. */
  blockIds: string[];
  /** Template version the client last read; a stale value answers with a 409. */
  version: number;
}
