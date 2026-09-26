import "server-only";

import { z } from "zod";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { conversationService } from "@/server/workspace/crm/services/conversation-service";

/** Only someone who may reassign the conversation learns who else could own it. */
export async function listConversationOwnerCandidates(
  customerId: string,
  actor: WorkspaceActor,
): Promise<WorkspaceMemberOptionDto[]> {
  if (
    !z.uuid().safeParse(customerId).success ||
    !canOn(actor, Permission.ChatRead, { customerId }) ||
    !canOn(actor, Permission.ChatWrite, { customerId })
  )
    return [];
  return getDrizzleDatabaseClient().transaction((tx) =>
    conversationService.listOwnerCandidates(tx, customerId),
  );
}
