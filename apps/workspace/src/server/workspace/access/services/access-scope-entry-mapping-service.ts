import "server-only";

import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessScopeEntryRow } from "@invessiv/common/contracts/auth/rows/access-scope-entry-row";
import { accessScopeMappingService } from "@/server/workspace/access/services/access-scope-mapping-service";

/**
 * Maps a joined row to the list entry. The scope union is built once, in the slim mapper;
 * this one only adds the display fields.
 */
function mapRow(row: AccessScopeEntryRow): AccessScopeEntryDto {
  return {
    ...accessScopeMappingService.mapRow(row),
    memberDisplayName: row.member_display_name,
    roleName: row.role_name,
    roleSystemKey: row.role_system_key,
    roleActive: row.role_active,
    customerNumber: row.customer_number,
    customerDisplayName: row.customer_display_name,
    projectTitle: row.project_title,
  };
}

export const accessScopeEntryMappingService = { mapRow } as const;
