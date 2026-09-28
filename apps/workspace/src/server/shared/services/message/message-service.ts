import "server-only";

import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import {
  MESSAGE_PAGE_SIZE,
  PORTAL_MESSAGE_RATE_WINDOW_SECONDS,
  PORTAL_MESSAGES_PER_HOUR,
} from "@invessiv/common/constants/crm/message-limits";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { messages, portalMemberships } from "@invessiv/db/record-configuration";
import { MESSAGE_ACTIVITY_ENTITY } from "@/common/constants/crm/message-activity-metadata";
import { activityService } from "../activity-service";
import type { ConversationReader } from "./conversation-reader-types";
import { conversationService } from "./conversation-service";
import { messageMappingService } from "./message-mapping-service";

const MAX_CURSOR_LENGTH = 256;
const CURSOR_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}Z$/;

type CursorPosition = { createdAt: string; id: string };

type TextMessageInput = {
  clientMessageId: string;
  conversationId: string;
  customerId: string;
  body: string;
  sender: ConversationReader;
  senderDisplayName: string;
  actorType: typeof ActorType.User | typeof ActorType.Customer;
  actorUserId: string;
};

function parseCursorPosition(value: unknown): CursorPosition | null {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "string" ||
    typeof value[1] !== "string"
  )
    return null;
  const [createdAt, id] = value;
  const validTimestamp =
    CURSOR_TIMESTAMP_PATTERN.test(createdAt) &&
    Number.isFinite(new Date(createdAt).getTime());
  return validTimestamp && isUuid(id) ? { createdAt, id } : null;
}

function decodeMessageCursor(cursor: string): CursorPosition | null {
  if (cursor.length > MAX_CURSOR_LENGTH) return null;
  try {
    return parseCursorPosition(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
  } catch {
    return null;
  }
}

/** The timestamp keeps microseconds as text; a JS `Date` would cut them and skip rows. */
function encodeMessageCursor(position: CursorPosition): string {
  return Buffer.from(
    JSON.stringify([position.createdAt, position.id]),
  ).toString("base64url");
}

function olderThan(position: CursorPosition) {
  return or(
    sql`${messages.created_at}
      < cast(
      ${position.createdAt}
      as
      timestamptz
      )`,
    and(
      sql`${messages.created_at}
        = cast(
        ${position.createdAt}
        as
        timestamptz
        )`,
      sql`${messages.id}
        < cast(
        ${position.id}
        as
        uuid
        )`,
    ),
  );
}

async function selectMessagePageRows(
  tx: ContactDatabaseTransaction,
  conversationId: string,
  position: CursorPosition | null,
) {
  return tx
    .select({
      message: messages,
      cursorAt: sql<string>`to_char(${messages.created_at} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversation_id, conversationId),
        position ? olderThan(position) : undefined,
      ),
    )
    .orderBy(desc(messages.created_at), desc(messages.id))
    .limit(MESSAGE_PAGE_SIZE + 1);
}

/**
 * Newest page, or the page before `cursor`, in chronological order. Null only for a cursor that
 * was not issued by this service; the caller answers that as a validation error.
 */
async function getMessagePage(
  tx: ContactDatabaseTransaction,
  conversationId: string,
  cursor: string | null,
  viewer: ConversationReader | null,
): Promise<Pick<ConversationDto, "messages" | "nextCursor"> | null> {
  const position = cursor ? decodeMessageCursor(cursor) : null;
  if (cursor && !position) return null;
  const rows = await selectMessagePageRows(tx, conversationId, position);
  const page = rows.slice(0, MESSAGE_PAGE_SIZE);
  const oldest = page.at(-1);
  return {
    messages: page
      .reverse()
      .map((row) => messageMappingService.toDto(row.message, viewer)),
    nextCursor:
      rows.length > MESSAGE_PAGE_SIZE && oldest
        ? encodeMessageCursor({
            createdAt: oldest.cursorAt,
            id: oldest.message.id,
          })
        : null,
  };
}

function senderColumns(sender: ConversationReader) {
  return {
    sender_side: sender.side,
    sender_member_id:
      sender.side === MessageSenderSide.Internal ? sender.memberId : null,
    sender_portal_membership_id:
      sender.side === MessageSenderSide.Customer
        ? sender.portalMembershipId
        : null,
  };
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
    metadata: { entity: MESSAGE_ACTIVITY_ENTITY, message_id: message.id },
    occurredAt: message.created_at,
  });
}

/**
 * The earlier message of a retried send, but only if it is really the same send: same sender,
 * conversation and text (or since redacted). A reused client id with other content matches nothing.
 */
async function findMatchingTextMessage(
  tx: ContactDatabaseTransaction,
  input: Pick<
    TextMessageInput,
    "clientMessageId" | "conversationId" | "body" | "sender"
  >,
) {
  const [existing] = await tx
    .select()
    .from(messages)
    .where(eq(messages.client_message_id, input.clientMessageId))
    .limit(1);
  if (!existing) return null;
  const sender = senderColumns(input.sender);
  const sameSend =
    existing.conversation_id === input.conversationId &&
    existing.sender_side === sender.sender_side &&
    existing.sender_member_id === sender.sender_member_id &&
    existing.sender_portal_membership_id ===
      sender.sender_portal_membership_id &&
    (existing.body === input.body || existing.redacted_at !== null);
  return sameSend ? existing : null;
}

/** Idempotent per `clientMessageId`: a retry returns the stored message, or null on a mismatch. */
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
      ...senderColumns(input.sender),
      sender_display_name: input.senderDisplayName,
      created_at: sql`clock_timestamp
        ()`,
      redacted_at: null,
      redacted_by_member_id: null,
    })
    .onConflictDoNothing({ target: messages.client_message_id })
    .returning();
  if (!message) return findMatchingTextMessage(tx, input);
  await conversationService.touchLastMessageAt(
    tx,
    input.conversationId,
    message.id,
  );
  await recordTextMessageCreation(tx, input, message);
  return message;
}

/** Creates the conversation if needed; null only when the customer does not exist. */
async function appendSystemMessage(
  tx: ContactDatabaseTransaction,
  customerId: string,
  key: string,
  params: Record<string, string>,
) {
  const conversation = await conversationService.ensureCustomerConversation(
    tx,
    customerId,
  );
  if (!conversation) return null;
  const [message] = await tx
    .insert(messages)
    .values({
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      client_message_id: null,
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
    })
    .returning();
  await conversationService.touchLastMessageAt(tx, conversation.id, message.id);
  return message;
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
  appendSystemMessage,
  appendTextMessage,
  findMatchingTextMessage,
  findPortalSendRetryAfter,
  getMessagePage,
} as const;
