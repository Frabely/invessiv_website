import "server-only";

import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import type { PortalMembershipOptionRow } from "@invessiv/common/contracts/portal/rows/portal-membership-option-row";

/** Fields are copied one by one instead of spreading the row, same rule as the access lookup. */
function mapMembershipRow(
  row: PortalMembershipOptionRow,
): PortalMembershipOptionDto {
  return {
    customerId: row.customer_id,
    displayName: row.display_name,
  };
}

export const portalMembershipOptionMappingService = {
  mapMembershipRow,
} as const;
