import "server-only";

import {
  and,
  type AnyColumn,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  conversationReads,
  conversations,
  customers,
  messages,
} from "@invessiv/db/record-configuration";
import type { ConversationReader } from "./conversation-reader-types";

function otherSide(side: ConversationReader["side"]) {
  return side === MessageSenderSide.Internal
    ? MessageSenderSide.Customer
    : MessageSenderSide.Internal;
}

function readerColumn(reader: ConversationReader) {
  return reader.side === MessageSenderSide.Internal
    ? conversationReads.member_id
    : conversationReads.portal_membership_id;
}

function readerId(reader: ConversationReader): string {
  return reader.side === MessageSenderSide.Internal
    ? reader.memberId
    : reader.portalMembershipId;
}

/** Join condition for the read position of `reader`; pairs with `unreadMessageCondition`. */
function readPositionJoin(
  reader: ConversationReader,
  conversationIdColumn: AnyColumn,
) {
  return and(
    eq(conversationReads.conversation_id, conversationIdColumn),
    eq(readerColumn(reader), readerId(reader)),
  );
}

/**
 * Text from the other side after the joined read position. Own and system messages never count.
 * The single definition of "unread" for the thread counter, the inbox and the navigation badge.
 */
function unreadMessageCondition(side: ConversationReader["side"]) {
  return and(
    eq(messages.type, MessageType.Text),
    eq(messages.sender_side, otherSide(side)),
    or(
      isNull(conversationReads.last_read_at),
      gt(messages.created_at, conversationReads.last_read_at),
    ),
  );
}

async function countUnreadMessages(
  tx: ContactDatabaseTransaction,
  conversationId: string,
  reader: ConversationReader,
): Promise<number> {
  const [result] = await tx
    .select({ value: count() })
    .from(messages)
    .leftJoin(
      conversationReads,
      readPositionJoin(reader, messages.conversation_id),
    )
    .where(
      and(
        eq(messages.conversation_id, conversationId),
        unreadMessageCondition(reader.side),
      ),
    );
  return result?.value ?? 0;
}

async function findSeenIncomingMessage(
  tx: ContactDatabaseTransaction,
  conversationId: string,
  messageId: string,
  reader: ConversationReader,
) {
  const [seen] = await tx
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.conversation_id, conversationId),
        eq(messages.type, MessageType.Text),
        eq(messages.sender_side, otherSide(reader.side)),
      ),
    )
    .limit(1);
  return seen ?? null;
}

/**
 * Moves the read position to the creation time of the last message the reader actually saw. The
 * database timestamp is taken, not the request time, so a reply that arrived in between stays
 * unread; the position never moves backwards.
 */
async function markReadThroughMessage(
  tx: ContactDatabaseTransaction,
  conversationId: string,
  lastSeenMessageId: string,
  reader: ConversationReader,
): Promise<boolean> {
  const seen = await findSeenIncomingMessage(
    tx,
    conversationId,
    lastSeenMessageId,
    reader,
  );
  if (!seen) return false;
  const column = readerColumn(reader);
  await tx
    .insert(conversationReads)
    .values({
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      member_id:
        reader.side === MessageSenderSide.Internal ? reader.memberId : null,
      portal_membership_id:
        reader.side === MessageSenderSide.Customer
          ? reader.portalMembershipId
          : null,
      last_read_at: sql`(select ${messages.created_at} from ${messages} where ${messages.id} = ${seen.id})`,
    })
    .onConflictDoUpdate({
      target: [conversationReads.conversation_id, column],
      targetWhere: isNotNull(column),
      set: {
        last_read_at: sql`greatest
                (
                ${conversationReads.last_read_at},
                ${sql.raw(`excluded.${conversationReads.last_read_at.name}`)}
                )`,
      },
    });
  return true;
}

/** Postgres `greatest` ignores null, so the first message simply sets the value. */
async function touchLastMessageAt(
  tx: ContactDatabaseTransaction,
  conversationId: string,
  messageId: string,
) {
  const messageAt = sql`(select ${messages.created_at} from ${messages} where ${messages.id} = ${messageId})`;
  await tx
    .update(conversations)
    .set({
      last_message_at: sql`greatest
            (
            ${conversations.last_message_at},
            ${messageAt}
            )`,
      updated_at: sql`clock_timestamp
            ()`,
    })
    .where(eq(conversations.id, conversationId));
}

/** `visibility` narrows the lookup to what the caller may see, inside the same `WHERE`. */
async function findCustomerConversation(
  tx: ContactDatabaseTransaction,
  customerId: string,
  visibility?: SQL,
) {
  const [conversation] = await tx
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.customer_id, customerId),
        isNull(conversations.project_id),
        visibility,
      ),
    )
    .limit(1);
  return conversation ?? null;
}

/**
 * Only writers call this: a conversation exists from its first message on, reading never creates
 * one. The responsible member is the customer owner at that moment — no separate member lock is
 * taken, because the customer already counts as that member's responsibility.
 */
async function ensureCustomerConversation(
  tx: ContactDatabaseTransaction,
  customerId: string,
) {
  const [customer] = await tx
    .select({ ownerMemberId: customers.owner_member_id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer) return null;
  await tx
    .insert(conversations)
    .values({
      id: crypto.randomUUID(),
      customer_id: customerId,
      project_id: null,
      owner_member_id: customer.ownerMemberId,
      version: 1,
    })
    .onConflictDoNothing();
  return findCustomerConversation(tx, customerId);
}

export const conversationService = {
  countUnreadMessages,
  ensureCustomerConversation,
  findCustomerConversation,
  markReadThroughMessage,
  readPositionJoin,
  touchLastMessageAt,
  unreadMessageCondition,
} as const;
