import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

export function buildLeadMarkContactedEndpoint(leadId: string): string {
  return `${WorkspaceApiEndpoint.Leads}/${encodeURIComponent(leadId)}/mark-contacted`;
}
