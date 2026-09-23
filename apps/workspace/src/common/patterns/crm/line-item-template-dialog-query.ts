import { LineItemTemplateFormDialogMode } from "@/common/constants/crm/forms/line-item-template-form-dialog-modes";
import { LineItemTemplateListQueryParam } from "@/common/constants/crm/list/line-item-template-list-query-params";
import type { LineItemTemplateDialogRequest } from "@/common/contracts/crm/line-item-template-dialog-request";
import {
  buildDialogHref as buildHref,
  createDialogRequestReader,
  type DialogSearchParamsInput as SearchParamsInput,
} from "@/common/patterns/crm/dialog-query-primitives";

/** Only the two supported shapes open a dialog; anything else leaves the list alone. */
export const readLineItemTemplateDialogRequest: (
  searchParams: SearchParamsInput,
) => LineItemTemplateDialogRequest | null = createDialogRequestReader(
  LineItemTemplateListQueryParam,
  LineItemTemplateFormDialogMode,
  "lineItemTemplateId",
);

function listParams(queryString = ""): URLSearchParams {
  const params = new URLSearchParams(queryString);
  params.delete(LineItemTemplateListQueryParam.Mode);
  params.delete(LineItemTemplateListQueryParam.Edit);
  return params;
}

export function buildLineItemTemplateCreateHref(
  basePath: string,
  queryString = "",
): string {
  const params = listParams(queryString);
  params.set(
    LineItemTemplateListQueryParam.Mode,
    LineItemTemplateFormDialogMode.Create,
  );
  return buildHref(basePath, params);
}

export function buildLineItemTemplateEditHref(
  basePath: string,
  lineItemTemplateId: string,
  queryString = "",
): string {
  const params = listParams(queryString);
  params.set(
    LineItemTemplateListQueryParam.Mode,
    LineItemTemplateFormDialogMode.Edit,
  );
  params.set(LineItemTemplateListQueryParam.Edit, lineItemTemplateId);
  return buildHref(basePath, params);
}

/** Closing keeps the same list state the page was in; kept as its own name for call-site clarity. */
export function buildLineItemTemplateDialogCloseHref(
  basePath: string,
  queryString = "",
): string {
  return buildHref(basePath, listParams(queryString));
}
