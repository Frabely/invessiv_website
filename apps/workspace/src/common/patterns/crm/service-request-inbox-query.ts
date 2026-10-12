import {
  ServiceRequestInboxQueryParam as Q,
  ServiceRequestInboxFilter as F,
  ServiceRequestDialogAction,
} from "@/common/constants/crm/service-request-inbox-query-params";
export function readServiceRequestInboxFilter(
  params: Record<string, string | string[] | undefined>,
): F {
  return params[Q.Filter] === F.All ? F.All : F.Open;
}
export function buildServiceRequestInboxHref(
  basePath: string,
  filter: F,
): string {
  const params = new URLSearchParams();
  params.set(Q.Filter, filter);
  return basePath + "?" + params.toString();
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
