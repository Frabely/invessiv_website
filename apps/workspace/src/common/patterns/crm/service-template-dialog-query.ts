import { ServiceTemplateFormDialogMode } from "@/common/constants/crm/forms/service-template-form-dialog-modes";
import { ServiceTemplateListQueryParam } from "@/common/constants/crm/list/service-template-list-query-params";
import type { ServiceTemplateDialogRequest } from "@/common/contracts/crm/service-template-dialog-request";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function readSingle(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Only the two supported shapes open a dialog; anything else leaves the list alone. */
export function readServiceTemplateDialogRequest(
  searchParams: SearchParamsInput,
): ServiceTemplateDialogRequest | null {
  const mode = readSingle(searchParams[ServiceTemplateListQueryParam.Mode]);

  if (mode === ServiceTemplateFormDialogMode.Create) {
    return { mode: ServiceTemplateFormDialogMode.Create };
  }

  const serviceTemplateId = readSingle(
    searchParams[ServiceTemplateListQueryParam.Edit],
  );
  if (mode === ServiceTemplateFormDialogMode.Edit && serviceTemplateId) {
    return { mode: ServiceTemplateFormDialogMode.Edit, serviceTemplateId };
  }

  return null;
}

export function readServiceTemplateIncludeArchived(
  searchParams: SearchParamsInput,
): boolean {
  return (
    readSingle(searchParams[ServiceTemplateListQueryParam.IncludeArchived]) ===
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

function buildHref(basePath: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
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

export function buildServiceTemplateDialogCloseHref(
  basePath: string,
  includeArchived: boolean,
): string {
  return buildHref(basePath, listParams("", includeArchived));
}
