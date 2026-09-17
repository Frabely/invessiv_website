import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const LEAD_CONVERSION_ACTION = "convert";

export function crmCustomerEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}`;
}

export function crmLeadConversionEndpoint(leadId: string): string {
  return `${WorkspaceApiEndpoint.CrmLeadConversions}/${leadId}/${LEAD_CONVERSION_ACTION}`;
}
