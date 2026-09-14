import "server-only";

import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";

export async function listWorkspaceMembers(): Promise<WorkspaceMemberDto[]> {
  return workspaceMemberReadService.list(getDrizzleDatabaseClient());
}
