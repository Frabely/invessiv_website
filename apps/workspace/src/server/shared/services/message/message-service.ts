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
} from "drizzle-orm";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import {
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_PAGE_SIZE,
} from "@invessiv/common/constants/crm/message-limits";
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
import { messageMappingService } from "./message-mapping-service";
import { activityService } from "../activity-service";

type TextMessageInput = {
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

function validateBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MESSAGE_BODY_MAX_LENGTH
    ? trimmed
    : null;
}

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
      !/^[0-9a-f-]{36}$/i.test(parsed[1])
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
): Promise<Date | null> {
  const [read] = await db
    .select({ at: conversationReads.last_read_at })
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
        lastReadAt ? gt(messages.created_at, lastReadAt) : undefined,
      ),
    );
  return result?.value ?? 0;
}

async function markConversationRead(
  db: ContactDatabaseTransaction,
  conversationId: string,
  memberId: string | null,
  portalMembershipId: string | null,
  at = new Date(),
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
        ? sql`${conversationReads.member_id}
                    IS NOT NULL`
        : sql`${conversationReads.portal_membership_id}
                    IS NOT NULL`,
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

async function updateLastMessageAt(
  db: ContactDatabaseTransaction,
  conversationId: string,
  at: Date,
) {
  await db
    .update(conversations)
    .set({
      last_message_at: sql`greatest
            (coalesce(
            ${conversations.last_message_at},
            ${at}
            ),
            ${at}
            )`,
      updated_at: at,
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
  await updateLastMessageAt(tx, message.conversation_id, message.created_at);
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

async function appendTextMessage(
  tx: ContactDatabaseTransaction,
  input: TextMessageInput,
) {
  const now = new Date();
  const message = await insertMessageAndUpdateConversation(tx, {
    id: crypto.randomUUID(),
    conversation_id: input.conversationId,
    customer_id: input.customerId,
    type: MessageType.Text,
    body: input.body,
    metadata: null,
    sender_side: input.side,
    sender_member_id: input.memberId,
    sender_portal_membership_id: input.portalMembershipId,
    sender_display_name: input.displayName,
    created_at: now,
    redacted_at: null,
    redacted_by_member_id: null,
  });
  await markConversationRead(
    tx,
    input.conversationId,
    input.memberId,
    input.portalMembershipId,
    now,
  );
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
    created_at: new Date(),
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
): Promise<boolean> {
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
    .returning({ id: messages.id });
  return updated.length === 1;
}

export const messageService = {
  validateBody,
  getMessagePage,
  countUnreadMessages,
  markConversationRead,
  findCustomerConversation,
  ensureCustomerConversation,
  appendTextMessage,
  appendSystemMessage,
  findRedactableTextMessage,
  redactTextMessage,
} as const;
