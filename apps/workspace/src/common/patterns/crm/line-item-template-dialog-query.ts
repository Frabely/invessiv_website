import { LineItemTemplateFormDialogMode } from "@/common/constants/crm/forms/line-item-template-form-dialog-modes";
import { LineItemTemplateListQueryParam } from "@/common/constants/crm/list/line-item-template-list-query-params";
import type { LineItemTemplateDialogRequest } from "@/common/contracts/crm/line-item-template-dialog-request";
import {
  buildDialogHref as buildHref,
  createDialogRequestReader,
  type DialogSearchParamsInput as SearchParamsInput,
  readDialogSearchParam as readSingle,
} from "@/common/patterns/crm/dialog-query-primitives";

/** Only the two supported shapes open a dialog; anything else leaves the list alone. */
export const readLineItemTemplateDialogRequest: (
  searchParams: SearchParamsInput,
) => LineItemTemplateDialogRequest | null = createDialogRequestReader(
  LineItemTemplateListQueryParam,
  LineItemTemplateFormDialogMode,
  "lineItemTemplateId",
);

export function readLineItemTemplateIncludeArchived(
  searchParams: SearchParamsInput,
): boolean {
  return (
    readSingle(searchParams, LineItemTemplateListQueryParam.IncludeArchived) ===
    "true"
  );
}

function listParams(
  queryString: string,
  includeArchived: boolean,
): URLSearchParams {
  const params = new URLSearchParams(queryString);
  params.delete(LineItemTemplateListQueryParam.Mode);
  params.delete(LineItemTemplateListQueryParam.Edit);
  params.delete(LineItemTemplateListQueryParam.IncludeArchived);
  if (includeArchived) {
    params.set(LineItemTemplateListQueryParam.IncludeArchived, "true");
  }
  return params;
}

export function buildLineItemTemplateListHref(
  basePath: string,
  includeArchived: boolean,
): string {
  return buildHref(basePath, listParams("", includeArchived));
}

export function buildLineItemTemplateCreateHref(
  basePath: string,
  includeArchived: boolean,
): string {
  const params = listParams("", includeArchived);
  params.set(
    LineItemTemplateListQueryParam.Mode,
    LineItemTemplateFormDialogMode.Create,
  );
  return buildHref(basePath, params);
}

export function buildLineItemTemplateEditHref(
  basePath: string,
  lineItemTemplateId: string,
  includeArchived: boolean,
): string {
  const params = listParams("", includeArchived);
  params.set(
    LineItemTemplateListQueryParam.Mode,
    LineItemTemplateFormDialogMode.Edit,
  );
  params.set(LineItemTemplateListQueryParam.Edit, lineItemTemplateId);
  return buildHref(basePath, params);
}

/** Closing keeps the same list state as toggling archived would; kept as its own name for call-site clarity. */
export function buildLineItemTemplateDialogCloseHref(
  basePath: string,
  includeArchived: boolean,
): string {
  return buildLineItemTemplateListHref(basePath, includeArchived);
}
