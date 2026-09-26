import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  conversationReads,
  conversations,
  customers,
  messages,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { messageService } from "@/server/shared/services/message/message-service";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

async function getOrCreateConversationForPermission(
  db: ContactDatabaseTransaction,
  customerId: string,
  actor: WorkspaceActor,
  permission: Permission,
) {
  if (!z.uuid().safeParse(customerId).success) return null;
  if (!canOn(actor, permission, { customerId })) return null;
  const [visibleCustomer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        crmAccessCondition.forScope(accessScope(actor, permission), {
          customerId: customers.id,
        }),
      ),
    )
    .limit(1);
  if (!visibleCustomer) return null;
  return messageService.ensureCustomerConversation(db, customerId);
}

function getOrCreateReadableConversation(
  db: ContactDatabaseTransaction,
  customerId: string,
  actor: WorkspaceActor,
) {
  return getOrCreateConversationForPermission(
    db,
    customerId,
    actor,
    Permission.ChatRead,
  );
}

function getOrCreateWritableConversation(
  db: ContactDatabaseTransaction,
  customerId: string,
  actor: WorkspaceActor,
) {
  return getOrCreateConversationForPermission(
    db,
    customerId,
    actor,
    Permission.ChatWrite,
  );
}

async function getConversationOwnerDisplayName(
  db: ContactDatabaseTransaction,
  ownerMemberId: string,
): Promise<string> {
  const [owner] = await db
    .select({ displayName: users.display_name })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(eq(workspaceMembers.id, ownerMemberId))
    .limit(1);
  return owner?.displayName ?? "";
}

async function getConversationDetail(
  db: ContactDatabaseTransaction,
  conversation: typeof conversations.$inferSelect,
  actor: WorkspaceActor,
  cursor: string | null,
): Promise<InternalConversationDto | null> {
  const page = await messageService.getMessagePage(
    db,
    conversation.id,
    cursor,
    actor.workspaceMemberId,
    null,
  );
  if (!page) return null;
  const unreadCount = await messageService.countUnreadMessages(
    db,
    conversation.id,
    MessageSenderSide.Internal,
    actor.workspaceMemberId,
    null,
  );
  return conversationMappingService.toInternalDto(
    conversation,
    await getConversationOwnerDisplayName(db, conversation.owner_member_id),
    unreadCount,
    page,
  );
}

async function selectVisibleInboxRows(
  db: ContactDatabaseTransaction,
  actor: WorkspaceActor,
) {
  return db
    .select({
      conversation: conversations,
      customerName: customers.display_name,
      unreadCount:
        sql<number>`count(${messages.id}) filter (where ${messages.type} = ${MessageType.Text}
      and ${messages.sender_side} = ${MessageSenderSide.Customer}
      and (${conversationReads.last_read_at} is null or ${messages.created_at} > ${conversationReads.last_read_at}))`.mapWith(
          Number,
        ),
    })
    .from(conversations)
    .innerJoin(customers, eq(customers.id, conversations.customer_id))
    .leftJoin(
      conversationReads,
      and(
        eq(conversationReads.conversation_id, conversations.id),
        eq(conversationReads.member_id, actor.workspaceMemberId),
      ),
    )
    .leftJoin(messages, eq(messages.conversation_id, conversations.id))
    .where(
      and(
        isNull(conversations.project_id),
        crmAccessCondition.forScope(accessScope(actor, Permission.ChatRead), {
          customerId: conversations.customer_id,
          projectId: conversations.project_id,
        }),
      ),
    )
    .groupBy(conversations.id, customers.display_name)
    .orderBy(
      desc(conversations.last_message_at),
      desc(conversations.created_at),
    );
}

async function listVisibleInbox(
  db: ContactDatabaseTransaction,
  actor: WorkspaceActor,
): Promise<ConversationInboxItemDto[]> {
  const rows = await selectVisibleInboxRows(db, actor);
  return rows.map((row) =>
    conversationMappingService.toInboxItemDto(
      row.conversation,
      row.customerName,
      row.unreadCount,
    ),
  );
}

export const conversationService = {
  getOrCreateReadableConversation,
  getOrCreateWritableConversation,
  getConversationDetail,
  listVisibleInbox,
} as const;
