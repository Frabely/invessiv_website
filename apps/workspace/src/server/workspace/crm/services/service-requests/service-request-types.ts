import type { ServiceRequestRow } from "@invessiv/common/contracts/crm/rows/service-request-row";
export type ServiceRequestJoinedRow = {
  request: ServiceRequestRow;
  customerDisplayName: string;
  customerNumber: number;
  requestedProjectTitle: string | null;
};
