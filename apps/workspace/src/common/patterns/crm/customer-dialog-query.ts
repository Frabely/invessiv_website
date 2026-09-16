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

export function buildCustomerCreateHref(basePath: string): string {
  const params = new URLSearchParams({
    [CustomerListQueryParam.Mode]: CustomerFormDialogMode.Create,
  });
  return `${basePath}?${params.toString()}`;
}

export function buildCustomerEditHref(
  basePath: string,
  customerId: string,
): string {
  const params = new URLSearchParams({
    [CustomerListQueryParam.Mode]: CustomerFormDialogMode.Edit,
    [CustomerListQueryParam.Edit]: customerId,
  });
  return `${basePath}?${params.toString()}`;
}
