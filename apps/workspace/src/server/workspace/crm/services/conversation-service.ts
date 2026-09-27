import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { ConversationInboxItemDto } from "@invessiv/common/contracts/crm/conversation-inbox-item.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  conversationReads,
  conversations,
  customers,
  messages,
  rolePermissions,
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { messageService } from "@/server/shared/services/message/message-service";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
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

/** Redaction is reserved for the workspace owner system role, independent of any CRM grant. */
async function memberIsWorkspaceOwner(
  db: ContactDatabaseTransaction,
  memberId: string,
): Promise<boolean> {
  const [ownerRole] = await db
    .select({ id: workspaceMemberRoles.role_id })
    .from(workspaceMemberRoles)
    .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
    .where(
      and(
        eq(workspaceMemberRoles.workspace_member_id, memberId),
        eq(roles.system_key, SystemRoleKey.WorkspaceOwner),
      ),
    )
    .limit(1);
  return Boolean(ownerRole);
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
    await memberIsWorkspaceOwner(db, actor.workspaceMemberId),
  );
}

function visibleCustomerConversation(actor: WorkspaceActor) {
  return and(
    isNull(conversations.project_id),
    crmAccessCondition.forScope(accessScope(actor, Permission.ChatRead), {
      customerId: conversations.customer_id,
      projectId: conversations.project_id,
    }),
  );
}

function viewerReadJoin(actor: WorkspaceActor) {
  return and(
    eq(conversationReads.conversation_id, conversations.id),
    eq(conversationReads.member_id, actor.workspaceMemberId),
  );
}

/** Customer text after the joined read position of the viewer; own and system messages never count. */
function unreadCustomerMessage() {
  return and(
    eq(messages.conversation_id, conversations.id),
    eq(messages.type, MessageType.Text),
    eq(messages.sender_side, MessageSenderSide.Customer),
    or(
      isNull(conversationReads.last_read_at),
      gt(messages.created_at, conversationReads.last_read_at),
    ),
  );
}

// One statement for the whole inbox: the newest message per conversation comes from a lateral
// join and the unread count from a correlated count, so the list never issues a query per row.
async function selectVisibleInboxRows(
  db: ContactDatabaseTransaction,
  actor: WorkspaceActor,
) {
  const lastMessage = db
    .select()
    .from(messages)
    .where(eq(messages.conversation_id, conversations.id))
    .orderBy(desc(messages.created_at), desc(messages.id))
    .limit(1)
    .as("last_message");
  const unreadCount = db
    .select({ value: count() })
    .from(messages)
    .where(unreadCustomerMessage());
  return db
    .select({
      conversation: conversations,
      customerName: customers.display_name,
      ownerName: users.display_name,
      lastMessage: {
        id: lastMessage.id,
        conversation_id: lastMessage.conversation_id,
        client_message_id: lastMessage.client_message_id,
        customer_id: lastMessage.customer_id,
        type: lastMessage.type,
        body: lastMessage.body,
        metadata: lastMessage.metadata,
        sender_side: lastMessage.sender_side,
        sender_member_id: lastMessage.sender_member_id,
        sender_portal_membership_id: lastMessage.sender_portal_membership_id,
        sender_display_name: lastMessage.sender_display_name,
        created_at: lastMessage.created_at,
        redacted_at: lastMessage.redacted_at,
        redacted_by_member_id: lastMessage.redacted_by_member_id,
      },
      unreadCount: sql<number>`(${unreadCount})`.mapWith(Number),
    })
    .from(conversations)
    .innerJoin(customers, eq(customers.id, conversations.customer_id))
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.id, conversations.owner_member_id),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .leftJoin(conversationReads, viewerReadJoin(actor))
    .leftJoinLateral(lastMessage, sql`true`)
    .where(visibleCustomerConversation(actor))
    .orderBy(
      sql`${conversations.last_message_at} desc nulls last`,
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
      {
        customerDisplayName: row.customerName,
        ownerDisplayName: row.ownerName,
      },
      row.unreadCount,
      row.lastMessage
        ? messageMappingService.toDto(
            row.lastMessage,
            actor.workspaceMemberId,
            null,
          )
        : null,
    ),
  );
}

async function countUnreadConversations(
  db: ContactDatabaseTransaction,
  actor: WorkspaceActor,
): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(conversations)
    .leftJoin(conversationReads, viewerReadJoin(actor))
    .where(
      and(
        visibleCustomerConversation(actor),
        exists(
          db
            .select({ id: messages.id })
            .from(messages)
            .where(unreadCustomerMessage()),
        ),
      ),
    );
  return result?.value ?? 0;
}

function roleGrantsChatRead() {
  return and(
    eq(roles.active, true),
    eq(rolePermissions.permission_key, Permission.ChatRead),
  );
}

/**
 * Active members who may own the conversation: `chat.read` workspace-wide or bound to the customer
 * itself. The owner command re-checks this; the list only avoids offering doomed choices.
 */
async function selectOwnerCandidates(
  db: ContactDatabaseTransaction,
  customerId: string,
  memberId: string | null,
) {
  const globalGrant = db
    .select({ id: workspaceMemberRoles.role_id })
    .from(workspaceMemberRoles)
    .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
    .innerJoin(rolePermissions, eq(rolePermissions.role_id, roles.id))
    .where(
      and(
        eq(workspaceMemberRoles.workspace_member_id, workspaceMembers.id),
        roleGrantsChatRead(),
      ),
    );
  const customerGrant = db
    .select({ id: workspaceMemberScopedRoles.role_id })
    .from(workspaceMemberScopedRoles)
    .innerJoin(roles, eq(roles.id, workspaceMemberScopedRoles.role_id))
    .innerJoin(rolePermissions, eq(rolePermissions.role_id, roles.id))
    .where(
      and(
        eq(workspaceMemberScopedRoles.workspace_member_id, workspaceMembers.id),
        eq(workspaceMemberScopedRoles.customer_id, customerId),
        isNull(workspaceMemberScopedRoles.project_id),
        roleGrantsChatRead(),
      ),
    );
  return db
    .select({ id: workspaceMembers.id, displayName: users.display_name })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(
      and(
        eq(workspaceMembers.active, true),
        eq(users.active, true),
        memberId ? eq(workspaceMembers.id, memberId) : undefined,
        or(exists(globalGrant), exists(customerGrant)),
      ),
    )
    .orderBy(asc(users.display_name), asc(workspaceMembers.id));
}

function listOwnerCandidates(
  db: ContactDatabaseTransaction,
  customerId: string,
): Promise<WorkspaceMemberOptionDto[]> {
  return selectOwnerCandidates(db, customerId, null);
}

async function memberHasChatRead(
  db: ContactDatabaseTransaction,
  customerId: string,
  memberId: string,
): Promise<boolean> {
  return (await selectOwnerCandidates(db, customerId, memberId)).length > 0;
}

export const conversationService = {
  getOrCreateReadableConversation,
  getOrCreateWritableConversation,
  getConversationDetail,
  listVisibleInbox,
  countUnreadConversations,
  listOwnerCandidates,
  memberHasChatRead,
  memberIsWorkspaceOwner,
} as const;
