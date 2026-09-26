import "server-only";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
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
import { canOn } from "@/common/patterns/auth/can-on";
import { messageService } from "@/server/shared/services/message/message-service";

async function getOrCreateAccessibleConversation(
  db: ContactDatabaseTransaction,
  customerId: string,
  actor: WorkspaceActor,
) {
  if (!z.uuid().safeParse(customerId).success) return null;
  if (!canOn(actor, Permission.ChatRead, { customerId })) return null;
  return messageService.ensureCustomerConversation(db, customerId);
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
  return {
    id: conversation.id,
    customerId: conversation.customer_id,
    ownerMemberId: conversation.owner_member_id,
    ownerDisplayName: await getConversationOwnerDisplayName(
      db,
      conversation.owner_member_id,
    ),
    version: conversation.version,
    unreadCount,
    lastMessageAt: conversation.last_message_at?.toISOString() ?? null,
    ...page,
  };
}

function getReadableCustomerIds(actor: WorkspaceActor): string[] {
  return [...actor.customerPermissions.entries()]
    .filter(([, permissions]) => permissions.has(Permission.ChatRead))
    .map(([id]) => id);
}

async function selectVisibleInboxRows(
  db: ContactDatabaseTransaction,
  actor: WorkspaceActor,
  visibleCustomerIds: string[],
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
        actor.permissions.has(Permission.ChatRead)
          ? undefined
          : inArray(conversations.customer_id, visibleCustomerIds),
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
  const visibleCustomerIds = getReadableCustomerIds(actor);
  if (
    !actor.permissions.has(Permission.ChatRead) &&
    visibleCustomerIds.length === 0
  )
    return [];
  const rows = await selectVisibleInboxRows(db, actor, visibleCustomerIds);
  return rows.map((row): ConversationInboxItemDto => ({
    id: row.conversation.id,
    customerId: row.conversation.customer_id,
    customerDisplayName: row.customerName,
    ownerMemberId: row.conversation.owner_member_id,
    unreadCount: row.unreadCount,
    lastMessageAt: row.conversation.last_message_at?.toISOString() ?? null,
  }));
}

export const conversationService = {
  getOrCreateAccessibleConversation,
  getConversationDetail,
  listVisibleInbox,
} as const;
