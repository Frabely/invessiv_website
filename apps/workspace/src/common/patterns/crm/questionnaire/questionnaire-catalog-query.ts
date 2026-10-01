import {
  QUESTIONNAIRE_CATALOG_DIALOG_MODE_VALUES,
  type QuestionnaireCatalogDialogMode,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-dialog-modes";
import { QuestionnaireCatalogQueryParam } from "@/common/constants/crm/questionnaire/questionnaire-catalog-query-params";
import type { QuestionnaireCatalogFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-filters";
import {
  buildDialogHref,
  type DialogSearchParamsInput,
  readDialogSearchParam,
} from "@/common/patterns/crm/dialog-query-primitives";
import { buildQuestionnaireCatalogQueryString } from "@/common/patterns/crm/questionnaire/questionnaire-catalog-search-params";

/** An unknown mode opens nothing; the list stays as it is. */
export function readQuestionnaireCatalogDialogMode(
  searchParams: DialogSearchParamsInput,
): QuestionnaireCatalogDialogMode | null {
  const mode = readDialogSearchParam(
    searchParams,
    QuestionnaireCatalogQueryParam.Mode,
  );
  return (
    QUESTIONNAIRE_CATALOG_DIALOG_MODE_VALUES.find((value) => value === mode) ??
    null
  );
}

/** The catalog in the given state; `mode` opens a dialog on top of it. */
export function buildQuestionnaireCatalogHref(
  basePath: string,
  filters: QuestionnaireCatalogFilters,
  mode: QuestionnaireCatalogDialogMode | null = null,
): string {
  const params = new URLSearchParams(
    buildQuestionnaireCatalogQueryString(filters),
  );
  if (mode) params.set(QuestionnaireCatalogQueryParam.Mode, mode);
  return buildDialogHref(basePath, params);
}
