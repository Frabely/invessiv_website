import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import { CustomerListQueryParam } from "@/common/constants/crm/list/customer-list-query-params";
import type { CockpitSelection } from "@/common/contracts/crm/cockpit-selection";
import type { CustomerDialogRequest } from "@/common/contracts/crm/customer-dialog-request";
import {
  buildDialogHref as buildHref,
  createDialogRequestReader,
  type DialogSearchParamsInput as SearchParamsInput,
  readDialogSearchParam as readSingle,
} from "@/common/patterns/crm/dialog-query-primitives";

/** Only the two supported shapes open a dialog; anything else leaves the overview alone. */
export const readCustomerDialogRequest: (
  searchParams: SearchParamsInput,
) => CustomerDialogRequest | null = createDialogRequestReader(
  CustomerListQueryParam,
  CustomerFormDialogMode,
  "customerId",
);

function listParams(queryString = ""): URLSearchParams {
  const params = new URLSearchParams(queryString);
  params.delete(CustomerListQueryParam.Mode);
  params.delete(CustomerListQueryParam.Edit);
  deleteCockpitParams(params);
  return params;
}

/** Project tab and round detail belong to one cockpit; they never outlive it. */
function deleteCockpitParams(params: URLSearchParams) {
  params.delete(CustomerListQueryParam.Cockpit);
  params.delete(CustomerListQueryParam.Project);
  params.delete(CustomerListQueryParam.FeedbackRound);
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

export function readCockpitProjectId(
  searchParams: SearchParamsInput,
): string | null {
  return readSingle(searchParams, CustomerListQueryParam.Project);
}

export function readCockpitFeedbackRoundId(
  searchParams: SearchParamsInput,
): string | null {
  return readSingle(searchParams, CustomerListQueryParam.FeedbackRound);
}

/**
 * Opens a customer cockpit, optionally on one project tab and one feedback round. Chat notices,
 * the feedback inbox and the tabs themselves link through here, so the URL shape exists once.
 */
export function buildCustomerCockpitHref(
  basePath: string,
  customerId: string,
  queryString = "",
  selection: CockpitSelection = {},
): string {
  const params = new URLSearchParams(queryString);
  if (params.get(CustomerListQueryParam.Cockpit) !== customerId)
    deleteCockpitParams(params);
  params.set(CustomerListQueryParam.Cockpit, customerId);
  params.delete(CustomerListQueryParam.Project);
  params.delete(CustomerListQueryParam.FeedbackRound);
  if (selection.projectId)
    params.set(CustomerListQueryParam.Project, selection.projectId);
  if (selection.projectId && selection.feedbackRoundId)
    params.set(CustomerListQueryParam.FeedbackRound, selection.feedbackRoundId);
  return buildHref(basePath, params);
}

export function buildCustomerCockpitCloseHref(
  basePath: string,
  queryString = "",
): string {
  const params = new URLSearchParams(queryString);
  deleteCockpitParams(params);
  return buildHref(basePath, params);
}
