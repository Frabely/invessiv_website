import type { ServiceRequestRow } from "@invessiv/common/contracts/crm/rows/service-request-row";
export type ServiceRequestJoinedRow = {
  request: ServiceRequestRow;
  customerDisplayName: string;
  customerNumber: number;
  requestedProjectTitle: string | null;
};

/** One page of a request list. */
export type ServiceRequestListWindow = { limit: number; offset: number };

/** What narrows a request list; the actor's access scope always applies on top. */
export type ServiceRequestListFilter = {
  customerId?: string;
  openOnly?: boolean;
  requestId?: string;
  window?: ServiceRequestListWindow;
};
