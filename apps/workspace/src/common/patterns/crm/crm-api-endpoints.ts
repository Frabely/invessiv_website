import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

export function crmCustomerEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}`;
}
