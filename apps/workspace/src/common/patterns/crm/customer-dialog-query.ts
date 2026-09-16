import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import type { CustomerDialogRequest } from "@/common/contracts/crm/customer-dialog-request";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function readSingle(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Only the two supported shapes open a dialog; anything else leaves the overview alone. */
export function readCustomerDialogRequest(
  searchParams: SearchParamsInput,
): CustomerDialogRequest | null {
  const mode = readSingle(searchParams[CustomerListQueryParam.Mode]);

  if (mode === CustomerFormDialogMode.Create) {
    return { mode: CustomerFormDialogMode.Create };
  }

  const customerId = readSingle(searchParams[CustomerListQueryParam.Edit]);
  if (mode === CustomerFormDialogMode.Edit && customerId) {
    return { mode: CustomerFormDialogMode.Edit, customerId };
  }

  return null;
}

function listParams(queryString = ""): URLSearchParams {
  const params = new URLSearchParams(queryString);
  params.delete(CustomerListQueryParam.Mode);
  params.delete(CustomerListQueryParam.Edit);
  return params;
}

function buildHref(basePath: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildCustomerCreateHref(
  basePath: string,
  queryString = "",
): string {
  const params = listParams(queryString);
  params.set(CustomerListQueryParam.Mode, CustomerFormDialogMode.Create);
  return buildHref(basePath, params);
}

export function buildCustomerEditHref(
  basePath: string,
  customerId: string,
  queryString = "",
): string {
  const params = listParams(queryString);
  params.set(CustomerListQueryParam.Mode, CustomerFormDialogMode.Edit);
  params.set(CustomerListQueryParam.Edit, customerId);
  return buildHref(basePath, params);
}

export function buildCustomerDialogCloseHref(
  basePath: string,
  queryString = "",
): string {
  return buildHref(basePath, listParams(queryString));
}
