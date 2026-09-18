import { ServiceTemplateFormDialogMode } from "@/common/constants/crm/forms/service-template-form-dialog-modes";
import { ServiceTemplateListQueryParam } from "@/common/constants/crm/list/service-template-list-query-params";
import type { ServiceTemplateDialogRequest } from "@/common/contracts/crm/service-template-dialog-request";
import {
  buildDialogHref as buildHref,
  createDialogRequestReader,
  type DialogSearchParamsInput as SearchParamsInput,
  readDialogSearchParam as readSingle,
} from "@/common/patterns/crm/dialog-query-primitives";

/** Only the two supported shapes open a dialog; anything else leaves the list alone. */
export const readServiceTemplateDialogRequest: (
  searchParams: SearchParamsInput,
) => ServiceTemplateDialogRequest | null = createDialogRequestReader(
  ServiceTemplateListQueryParam,
  ServiceTemplateFormDialogMode,
  "serviceTemplateId",
);

export function readServiceTemplateIncludeArchived(
  searchParams: SearchParamsInput,
): boolean {
  return (
    readSingle(searchParams, ServiceTemplateListQueryParam.IncludeArchived) ===
    "true"
  );
}

function listParams(
  queryString: string,
  includeArchived: boolean,
): URLSearchParams {
  const params = new URLSearchParams(queryString);
  params.delete(ServiceTemplateListQueryParam.Mode);
  params.delete(ServiceTemplateListQueryParam.Edit);
  params.delete(ServiceTemplateListQueryParam.IncludeArchived);
  if (includeArchived) {
    params.set(ServiceTemplateListQueryParam.IncludeArchived, "true");
  }
  return params;
}

export function buildServiceTemplateListHref(
  basePath: string,
  includeArchived: boolean,
): string {
  return buildHref(basePath, listParams("", includeArchived));
}

export function buildServiceTemplateCreateHref(
  basePath: string,
  includeArchived: boolean,
): string {
  const params = listParams("", includeArchived);
  params.set(
    ServiceTemplateListQueryParam.Mode,
    ServiceTemplateFormDialogMode.Create,
  );
  return buildHref(basePath, params);
}

export function buildServiceTemplateEditHref(
  basePath: string,
  serviceTemplateId: string,
  includeArchived: boolean,
): string {
  const params = listParams("", includeArchived);
  params.set(
    ServiceTemplateListQueryParam.Mode,
    ServiceTemplateFormDialogMode.Edit,
  );
  params.set(ServiceTemplateListQueryParam.Edit, serviceTemplateId);
  return buildHref(basePath, params);
}

/** Closing keeps the same list state as toggling archived would; kept as its own name for call-site clarity. */
export function buildServiceTemplateDialogCloseHref(
  basePath: string,
  includeArchived: boolean,
): string {
  return buildServiceTemplateListHref(basePath, includeArchived);
}
