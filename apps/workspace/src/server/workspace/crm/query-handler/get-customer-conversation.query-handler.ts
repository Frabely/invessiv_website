import "server-only";

import { eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  conversations,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { internalConversationMappingService } from "@/server/workspace/crm/services/internal-conversation-mapping-service";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

async function getOwnerDisplayName(
  tx: ContactDatabaseTransaction,
  ownerMemberId: string,
): Promise<string> {
  const [owner] = await tx
    .select({ displayName: users.display_name })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(eq(workspaceMembers.id, ownerMemberId))
    .limit(1);
  return owner?.displayName ?? "";
}

async function loadExistingConversation(
  tx: ContactDatabaseTransaction,
  conversation: typeof conversations.$inferSelect,
  actor: WorkspaceActor,
  cursor: string | null,
) {
  const reader = internalConversationService.readerOf(actor);
  const page = await messageService.getMessagePage(
    tx,
    conversation.id,
    cursor,
    reader,
  );
  if (!page)
    return { ok: false, code: MessageErrorCode.ValidationError } as const;
  const unreadCount = await conversationService.countUnreadMessages(
    tx,
    conversation.id,
    reader,
  );
  return {
    ok: true,
    conversation: internalConversationMappingService.toInternalDto(
      conversationMappingService.toConversationDto(
        conversation,
        conversation.customer_id,
        unreadCount,
        page,
      ),
      conversation,
      await getOwnerDisplayName(tx, conversation.owner_member_id),
    ),
  } as const;
}

async function loadVisibleConversation(
  tx: ContactDatabaseTransaction,
  customerId: string,
  actor: WorkspaceActor,
  cursor: string | null,
) {
  if (
    !(await internalConversationService.isCustomerVisible(
      tx,
      customerId,
      actor,
      Permission.ChatRead,
    ))
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const conversation = await conversationService.findCustomerConversation(
    tx,
    customerId,
  );
  if (conversation)
    return loadExistingConversation(tx, conversation, actor, cursor);
  // Reading never creates the conversation; the first message does.
  return {
    ok: true,
    conversation: internalConversationMappingService.toInternalDto(
      conversationMappingService.toConversationDto(null, customerId, 0, {
        messages: [],
        nextCursor: null,
      }),
      null,
      "",
    ),
  } as const;
}

export async function getCustomerConversation(
  customerId: string,
  actor: WorkspaceActor,
  cursor: string | null,
) {
  if (!isUuid(customerId) || !canOn(actor, Permission.ChatRead, { customerId }))
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction((tx) =>
    loadVisibleConversation(tx, customerId, actor, cursor),
  );
}
