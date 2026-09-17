import "server-only";

import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";

type CustomerCockpitRow = {
  id: string;
  customerNumber: number;
  displayName: string;
  status: CustomerCockpitDto["status"];
  ownerDisplayName: string;
  primaryContactName: string;
  primaryContactEmail: string | null;
};

function toDto(row: CustomerCockpitRow): CustomerCockpitDto {
  return row;
}

export const customerCockpitMappingService = { toDto } as const;
