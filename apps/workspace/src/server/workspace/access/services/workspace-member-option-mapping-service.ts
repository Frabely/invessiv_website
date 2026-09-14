import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import type { WorkspaceMemberOptionRow } from "@invessiv/common/contracts/auth/rows/workspace-member-option-row";

function mapRowsToOptions(
  rows: readonly WorkspaceMemberOptionRow[],
): WorkspaceMemberOptionDto[] {
  return rows.map((row) => ({
    id: row.member_id,
    displayName: row.display_name,
  }));
}

export const workspaceMemberOptionMappingService = {
  mapRowsToOptions,
} as const;
