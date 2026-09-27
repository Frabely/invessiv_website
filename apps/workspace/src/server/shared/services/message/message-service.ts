import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import {
  MESSAGE_PAGE_SIZE,
  PORTAL_MESSAGE_RATE_WINDOW_SECONDS,
  PORTAL_MESSAGES_PER_HOUR,
} from "@invessiv/common/constants/crm/message-limits";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
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
  portalMemberships,
} from "@invessiv/db/record-configuration";
import { messageMappingService } from "./message-mapping-service";
import { activityService } from "../activity-service";

type TextMessageInput = {
  clientMessageId: string;
  conversationId: string;
  customerId: string;
  body: string;
  side: typeof MessageSenderSide.Internal | typeof MessageSenderSide.Customer;
  memberId: string | null;
  portalMembershipId: string | null;
  displayName: string;
  actorType: typeof ActorType.User | typeof ActorType.Customer;
  actorUserId: string;
};

function decodeMessageCursor(
  cursor: string | null,
): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  if (cursor.length > 256) return null;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      typeof parsed[0] !== "string" ||
      typeof parsed[1] !== "string"
    )
      return null;
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}Z$/.test(parsed[0]) ||
      !Number.isFinite(new Date(parsed[0]).getTime()) ||
      !isUuid(parsed[1])
    )
      return null;
    return { createdAt: parsed[0], id: parsed[1] };
  } catch {
    return null;
  }
}

function encodeMessageCursor(row: {
  cursorAt: string;
  message: { id: string };
}) {
  return Buffer.from(JSON.stringify([row.cursorAt, row.message.id])).toString(
    "base64url",
  );
}

async function selectMessagePageRows(
  db: ContactDatabaseTransaction,
  conversationId: string,
  position: { createdAt: string; id: string } | null,
) {
  return db
    .select({
      message: messages,
      cursorAt: sql<string>`to_char(${messages.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversation_id, conversationId),
        position
          ? or(
              sql`${messages.created_at} < ${position.createdAt}::timestamptz`,
              and(
                sql`${messages.created_at} = ${position.createdAt}::timestamptz`,
                sql`${messages.id} < ${position.id}::uuid`,
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(messages.created_at), desc(messages.id))
    .limit(MESSAGE_PAGE_SIZE + 1);
}

async function getMessagePage(
  db: ContactDatabaseTransaction,
  conversationId: string,
  cursor: string | null,
  ownMemberId: string | null,
  ownPortalMembershipId: string | null,
) {
  const position = decodeMessageCursor(cursor);
  if (cursor && !position) return null;
  const rows = await selectMessagePageRows(db, conversationId, position);
  const selected = rows.slice(0, MESSAGE_PAGE_SIZE);
  const oldest = selected.at(-1);
  return {
    messages: selected
      .reverse()
      .map((row) =>
        messageMappingService.toDto(
          row.message,
          ownMemberId,
          ownPortalMembershipId,
        ),
      ),
    nextCursor:
      rows.length > MESSAGE_PAGE_SIZE && oldest
        ? encodeMessageCursor(oldest)
        : null,
  };
}

async function getLastReadAt(
  db: ContactDatabaseTransaction,
  conversationId: string,
  memberId: string | null,
  portalMembershipId: string | null,
): Promise<string | null> {
  const [read] = await db
    .select({
      at: sql<string>`to_char
        (
        ${conversationReads.last_read_at}
        AT
        TIME
        ZONE
        'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
        )`,
    })
    .from(conversationReads)
    .where(
      and(
        eq(conversationReads.conversation_id, conversationId),
        memberId
          ? eq(conversationReads.member_id, memberId)
          : eq(conversationReads.portal_membership_id, portalMembershipId!),
      ),
    )
    .limit(1);
  return read?.at ?? null;
}

async function countUnreadMessages(
  db: ContactDatabaseTransaction,
  conversationId: string,
  ownSide: MessageSenderSide,
  memberId: string | null,
  portalMembershipId: string | null,
) {
  const lastReadAt = await getLastReadAt(
    db,
    conversationId,
    memberId,
    portalMembershipId,
  );
  const [result] = await db
    .select({ value: count() })
    .from(messages)
    .where(
      and(
        eq(messages.conversation_id, conversationId),
        eq(messages.type, MessageType.Text),
        ownSide === MessageSenderSide.Internal
          ? eq(messages.sender_side, MessageSenderSide.Customer)
          : eq(messages.sender_side, MessageSenderSide.Internal),
        lastReadAt
          ? gt(
              messages.created_at,
              sql`${lastReadAt}
              ::timestamptz`,
            )
          : undefined,
      ),
    );
  return result?.value ?? 0;
}

async function markConversationReadAt(
  db: ContactDatabaseTransaction,
  conversationId: string,
  memberId: string | null,
  portalMembershipId: string | null,
  at: SQL,
) {
  const values = {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    member_id: memberId,
    portal_membership_id: portalMembershipId,
    last_read_at: at,
  };
  await db
    .insert(conversationReads)
    .values(values)
    .onConflictDoUpdate({
      target: memberId
        ? [conversationReads.conversation_id, conversationReads.member_id]
        : [
            conversationReads.conversation_id,
            conversationReads.portal_membership_id,
          ],
      targetWhere: memberId
        ? isNotNull(conversationReads.member_id)
        : isNotNull(conversationReads.portal_membership_id),
      set: {
        last_read_at: sql`greatest
        (
        ${conversationReads.last_read_at},
        excluded
        .
        last_read_at
        )`,
      },
    });
}

async function markConversationReadThroughMessage(
  db: ContactDatabaseTransaction,
  conversationId: string,
  lastSeenMessageId: string,
  memberId: string | null,
  portalMembershipId: string | null,
): Promise<boolean> {
  const [seen] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.id, lastSeenMessageId),
        eq(messages.conversation_id, conversationId),
        eq(messages.type, MessageType.Text),
        memberId
          ? eq(messages.sender_side, MessageSenderSide.Customer)
          : eq(messages.sender_side, MessageSenderSide.Internal),
      ),
    )
    .limit(1);
  if (!seen) return false;
  await markConversationReadAt(
    db,
    conversationId,
    memberId,
    portalMembershipId,
    sql`(select ${messages.created_at} from ${messages} where ${messages.id} = ${lastSeenMessageId})`,
  );
  return true;
}

async function updateLastMessageAt(
  db: ContactDatabaseTransaction,
  conversationId: string,
  messageId: string,
) {
  const messageAt = sql`(select ${messages.created_at} from ${messages} where ${messages.id} = ${messageId})`;
  await db
    .update(conversations)
    .set({
      last_message_at: sql`greatest
      (coalesce(
      ${conversations.last_message_at},
      ${messageAt}
      ),
      ${messageAt}
      )`,
      updated_at: sql`clock_timestamp
      ()`,
    })
    .where(eq(conversations.id, conversationId));
}

async function findCustomerConversation(
  tx: ContactDatabaseTransaction,
  customerId: string,
) {
  const [conversation] = await tx
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.customer_id, customerId),
        isNull(conversations.project_id),
      ),
    )
    .limit(1);
  return conversation ?? null;
}

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

async function insertMessageAndUpdateConversation(
  tx: ContactDatabaseTransaction,
  values: typeof messages.$inferInsert,
) {
  const [message] = await tx.insert(messages).values(values).returning();
  await updateLastMessageAt(tx, message.conversation_id, message.id);
  return message;
}

async function recordTextMessageCreation(
  tx: ContactDatabaseTransaction,
  input: TextMessageInput,
  message: typeof messages.$inferSelect,
) {
  await activityService.createActivity(tx, {
    customerId: input.customerId,
    actor: { type: input.actorType, userId: input.actorUserId },
    type: ActivityType.Created,
    metadata: { entity: "message", message_id: message.id },
    occurredAt: message.created_at,
  });
}

async function findMatchingTextMessage(
  tx: ContactDatabaseTransaction,
  input: Pick<
    TextMessageInput,
    | "clientMessageId"
    | "conversationId"
    | "body"
    | "side"
    | "memberId"
    | "portalMembershipId"
  >,
) {
  const [existing] = await tx
    .select()
    .from(messages)
    .where(eq(messages.client_message_id, input.clientMessageId))
    .limit(1);
  return existing &&
    existing.conversation_id === input.conversationId &&
    existing.sender_side === input.side &&
    existing.sender_member_id === input.memberId &&
    existing.sender_portal_membership_id === input.portalMembershipId &&
    (existing.body === input.body || existing.redacted_at !== null)
    ? existing
    : null;
}

async function appendTextMessage(
  tx: ContactDatabaseTransaction,
  input: TextMessageInput,
) {
  const [message] = await tx
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      conversation_id: input.conversationId,
      client_message_id: input.clientMessageId,
      customer_id: input.customerId,
      type: MessageType.Text,
      body: input.body,
      metadata: null,
      sender_side: input.side,
      sender_member_id: input.memberId,
      sender_portal_membership_id: input.portalMembershipId,
      sender_display_name: input.displayName,
      created_at: sql`clock_timestamp
        ()`,
      redacted_at: null,
      redacted_by_member_id: null,
    })
    .onConflictDoNothing({ target: messages.client_message_id })
    .returning();
  if (!message) return findMatchingTextMessage(tx, input);
  await updateLastMessageAt(tx, input.conversationId, message.id);
  await recordTextMessageCreation(tx, input, message);
  return message;
}

async function appendSystemMessage(
  tx: ContactDatabaseTransaction,
  customerId: string,
  key: string,
  params: Record<string, string>,
) {
  const conversation = await ensureCustomerConversation(tx, customerId);
  if (!conversation) return null;

  return insertMessageAndUpdateConversation(tx, {
    id: crypto.randomUUID(),
    conversation_id: conversation.id,
    customer_id: customerId,
    type: MessageType.System,
    body: key,
    metadata: params,
    sender_side: MessageSenderSide.System,
    sender_member_id: null,
    sender_portal_membership_id: null,
    sender_display_name: "System",
    redacted_at: null,
    redacted_by_member_id: null,
  });
}

async function findRedactableTextMessage(
  tx: ContactDatabaseTransaction,
  messageId: string,
) {
  const [target] = await tx
    .select({
      customerId: messages.customer_id,
      conversationId: messages.conversation_id,
    })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversation_id))
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.type, MessageType.Text),
        isNull(messages.redacted_at),
        isNull(conversations.project_id),
      ),
    )
    .limit(1);
  return target ?? null;
}

async function redactTextMessage(
  tx: ContactDatabaseTransaction,
  messageId: string,
  target: { customerId: string; conversationId: string },
  memberId: string,
  at: Date,
): Promise<typeof messages.$inferSelect | null> {
  const updated = await tx
    .update(messages)
    .set({ body: null, redacted_at: at, redacted_by_member_id: memberId })
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.customer_id, target.customerId),
        eq(messages.conversation_id, target.conversationId),
        eq(messages.type, MessageType.Text),
        isNull(messages.redacted_at),
        isNotNull(messages.body),
      ),
    )
    .returning();
  return updated[0] ?? null;
}

/**
 * Seconds until the oldest counted message leaves the window, or null below the limit. Locks the
 * membership row first, so parallel sends of one member cannot all pass the same count.
 */
async function findPortalSendRetryAfter(
  tx: ContactDatabaseTransaction,
  portalMembershipId: string,
  now = new Date(),
): Promise<number | null> {
  await tx
    .select({ id: portalMemberships.id })
    .from(portalMemberships)
    .where(eq(portalMemberships.id, portalMembershipId))
    .for("update");
  const windowMs = PORTAL_MESSAGE_RATE_WINDOW_SECONDS * 1000;
  const counted = await tx
    .select({ createdAt: messages.created_at })
    .from(messages)
    .where(
      and(
        eq(messages.sender_portal_membership_id, portalMembershipId),
        gt(messages.created_at, new Date(now.getTime() - windowMs)),
      ),
    )
    .orderBy(desc(messages.created_at))
    .limit(PORTAL_MESSAGES_PER_HOUR);
  const oldest = counted.at(-1);
  if (counted.length < PORTAL_MESSAGES_PER_HOUR || !oldest) return null;
  return Math.max(
    1,
    Math.ceil((oldest.createdAt.getTime() + windowMs - now.getTime()) / 1000),
  );
}

export const messageService = {
  getMessagePage,
  countUnreadMessages,
  markConversationReadThroughMessage,
  findCustomerConversation,
  ensureCustomerConversation,
  appendTextMessage,
  findMatchingTextMessage,
  appendSystemMessage,
  findPortalSendRetryAfter,
  findRedactableTextMessage,
  redactTextMessage,
} as const;
