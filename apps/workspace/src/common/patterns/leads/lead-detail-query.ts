import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";

export function buildLeadDetailHref(basePath: string, leadId: string): string {
  const params = new URLSearchParams({
    [LeadListQueryParam.Selected]: leadId,
    [LeadListQueryParam.IncludeConverted]: "true",
  });
  return `${basePath}?${params.toString()}`;
}
