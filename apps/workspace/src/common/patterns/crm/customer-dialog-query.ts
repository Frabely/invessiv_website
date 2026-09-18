import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import type { CustomerDialogRequest } from "@/common/contracts/crm/customer-dialog-request";
import {
  buildDialogHref as buildHref,
  type DialogSearchParamsInput as SearchParamsInput,
  readDialogSearchParam as readSingle,
} from "@/common/patterns/crm/dialog-query-primitives";

/** Only the two supported shapes open a dialog; anything else leaves the overview alone. */
export function readCustomerDialogRequest(
  searchParams: SearchParamsInput,
): CustomerDialogRequest | null {
  const mode = readSingle(searchParams, CustomerListQueryParam.Mode);

  if (mode === CustomerFormDialogMode.Create) {
    return { mode: CustomerFormDialogMode.Create };
  }

  const customerId = readSingle(searchParams, CustomerListQueryParam.Edit);
  if (mode === CustomerFormDialogMode.Edit && customerId) {
    return { mode: CustomerFormDialogMode.Edit, customerId };
  }

  return null;
}

function listParams(queryString = ""): URLSearchParams {
  const params = new URLSearchParams(queryString);
  params.delete(CustomerListQueryParam.Mode);
  params.delete(CustomerListQueryParam.Edit);
  params.delete(CustomerListQueryParam.Cockpit);
  return params;
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

export function readCustomerCockpitId(
  searchParams: SearchParamsInput,
): string | null {
  return readSingle(searchParams, CustomerListQueryParam.Cockpit);
}

export function buildCustomerCockpitHref(
  basePath: string,
  customerId: string,
  queryString = "",
): string {
  const params = new URLSearchParams(queryString);
  params.set(CustomerListQueryParam.Cockpit, customerId);
  return buildHref(basePath, params);
}

export function buildCustomerCockpitCloseHref(
  basePath: string,
  queryString = "",
): string {
  const params = new URLSearchParams(queryString);
  params.delete(CustomerListQueryParam.Cockpit);
  return buildHref(basePath, params);
}
