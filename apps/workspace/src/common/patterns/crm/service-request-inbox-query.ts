import {
  ServiceRequestInboxQueryParam as Q,
  ServiceRequestInboxFilter as F,
  ServiceRequestDialogAction,
} from "@/common/constants/crm/service-request-inbox-query-params";
import {
  type ListSearchParamsInput,
  readListPage,
  readListSearchParam,
} from "@/common/patterns/crm/list-search-params-primitives";
export function readServiceRequestInboxFilter(
  params: Record<string, string | string[] | undefined>,
): F {
  return params[Q.Filter] === F.All ? F.All : F.Open;
}
export function readServiceRequestInboxPage(
  params: ListSearchParamsInput,
): number {
  return readListPage(readListSearchParam(params[Q.Page]));
}
/** The filter part of the inbox URL without a page; open is the default and leaves no parameter. */
export function buildServiceRequestInboxQueryString(filter: F): string {
  const params = new URLSearchParams();
  if (filter !== F.Open) params.set(Q.Filter, filter);
  return params.toString();
}
export function buildServiceRequestInboxHref(
  basePath: string,
  filter: F,
): string {
  const query = buildServiceRequestInboxQueryString(filter);
  return query ? basePath + "?" + query : basePath;
}
export function buildServiceRequestActionHref(
  basePath: string,
  queryString: string,
  id: string,
  action: ServiceRequestDialogAction | null,
): string {
  const params = new URLSearchParams(queryString);
  params.set(Q.Request, id);
  if (action) params.set(Q.Action, action);
  else params.delete(Q.Action);
  return basePath + "?" + params.toString();
}
