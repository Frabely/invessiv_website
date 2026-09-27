import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { WorkspaceMemberOptionDto } from "@invessiv/common/contracts/auth/workspace-member-option.dto";
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
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import type { ConversationReader } from "@/server/shared/services/message/conversation-reader-types";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { internalConversationMappingService } from "./internal-conversation-mapping-service";

function readerOf(actor: WorkspaceActor): ConversationReader {
  return {
    side: MessageSenderSide.Internal,
    memberId: actor.workspaceMemberId,
  };
}

/** The customer must be inside the actor's access scope for `permission`, checked in `WHERE`. */
async function isCustomerVisible(
  tx: ContactDatabaseTransaction,
  customerId: string,
  actor: WorkspaceActor,
  permission: Permission,
): Promise<boolean> {
  const [visible] = await tx
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
  return Boolean(visible);
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

function unreadMessagesOfConversation() {
  return and(
    eq(messages.conversation_id, conversations.id),
    conversationService.unreadMessageCondition(MessageSenderSide.Internal),
  );
}

// One statement for the whole inbox: the newest message per conversation comes from a lateral
// join and the unread count from a correlated count, so the list never issues a query per row.
async function selectVisibleInboxRows(
  tx: ContactDatabaseTransaction,
  actor: WorkspaceActor,
) {
  const lastMessage = tx
    .select()
    .from(messages)
    .where(eq(messages.conversation_id, conversations.id))
    .orderBy(desc(messages.created_at), desc(messages.id))
    .limit(1)
    .as("last_message");
  const unreadCount = tx
    .select({ value: count() })
    .from(messages)
    .where(unreadMessagesOfConversation());
  return tx
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
    .leftJoin(
      conversationReads,
      conversationService.readPositionJoin(readerOf(actor), conversations.id),
    )
    .leftJoinLateral(lastMessage, sql`true`)
    .where(visibleCustomerConversation(actor))
    .orderBy(
      sql`${conversations.last_message_at} desc nulls last`,
      desc(conversations.created_at),
    );
}

async function listVisibleInbox(
  tx: ContactDatabaseTransaction,
  actor: WorkspaceActor,
): Promise<ConversationInboxItemDto[]> {
  const rows = await selectVisibleInboxRows(tx, actor);
  return rows.map((row) =>
    internalConversationMappingService.toInboxItemDto(
      row.conversation,
      {
        customerDisplayName: row.customerName,
        ownerDisplayName: row.ownerName,
      },
      row.unreadCount,
      row.lastMessage
        ? messageMappingService.toDto(row.lastMessage, readerOf(actor))
        : null,
    ),
  );
}

async function countUnreadConversations(
  tx: ContactDatabaseTransaction,
  actor: WorkspaceActor,
): Promise<number> {
  const [result] = await tx
    .select({ value: count() })
    .from(conversations)
    .leftJoin(
      conversationReads,
      conversationService.readPositionJoin(readerOf(actor), conversations.id),
    )
    .where(
      and(
        visibleCustomerConversation(actor),
        exists(
          tx
            .select({ id: messages.id })
            .from(messages)
            .where(unreadMessagesOfConversation()),
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
 * itself. The list and the owner command share this query, so they cannot drift apart.
 */
async function selectOwnerCandidates(
  tx: ContactDatabaseTransaction,
  customerId: string,
  memberId: string | null,
) {
  const globalGrant = tx
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
  const customerGrant = tx
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
  return tx
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

/** Reassigning needs read and write on the customer; only then are the candidates revealed. */
function actorMayAssignOwner(
  actor: WorkspaceActor,
  customerId: string,
): boolean {
  return (
    isUuid(customerId) &&
    canOn(actor, Permission.ChatRead, { customerId }) &&
    canOn(actor, Permission.ChatWrite, { customerId })
  );
}

function listOwnerCandidates(
  tx: ContactDatabaseTransaction,
  customerId: string,
): Promise<WorkspaceMemberOptionDto[]> {
  return selectOwnerCandidates(tx, customerId, null);
}

async function memberHasChatRead(
  tx: ContactDatabaseTransaction,
  customerId: string,
  memberId: string,
): Promise<boolean> {
  return (await selectOwnerCandidates(tx, customerId, memberId)).length > 0;
}

export const internalConversationService = {
  actorMayAssignOwner,
  countUnreadConversations,
  isCustomerVisible,
  listOwnerCandidates,
  listVisibleInbox,
  memberHasChatRead,
  readerOf,
} as const;
