import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { users, workspaceMembers } from "@invessiv/db/record-configuration";
import { workspaceMemberOptionMappingService } from "@/server/workspace/access/services/workspace-member-option-mapping-service";

/** Only active memberships of active users can be chosen in other areas. */
export async function listWorkspaceMemberOptions(): Promise<
  WorkspaceMemberOptionDto[]
> {
  const rows = await getDrizzleDatabaseClient()
    .select({
      member_id: workspaceMembers.id,
      display_name: users.display_name,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(and(eq(workspaceMembers.active, true), eq(users.active, true)))
    .orderBy(asc(users.display_name), asc(workspaceMembers.id));

  return workspaceMemberOptionMappingService.mapRowsToOptions(rows);
}
