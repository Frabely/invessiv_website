import "server-only";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { MessageType } from "@invessiv/common/constants/crm/message-types";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { conversations, messages } from "@invessiv/db/record-configuration";
import {
  MESSAGE_ACTIVITY_ENTITY,
  MessageActivityChange,
} from "@/common/constants/crm/message-activity-metadata";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { can } from "@invessiv/common/patterns/auth/can";
import { canOn } from "@/common/patterns/auth/can-on";
import { activityService } from "@/server/shared/services/activity-service";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
import { internalConversationService } from "@/server/workspace/crm/services/internal-conversation-service";

/** Only unredacted text of a customer conversation; system events stay untouched. */
function redactableTextMessage(messageId: string) {
  return and(
    eq(messages.id, messageId),
    eq(messages.type, MessageType.Text),
    isNull(messages.redacted_at),
    isNotNull(messages.body),
  );
}

async function findRedactableCustomerId(
  tx: ContactDatabaseTransaction,
  messageId: string,
): Promise<string | null> {
  const [target] = await tx
    .select({ customerId: messages.customer_id })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversation_id))
    .where(
      and(redactableTextMessage(messageId), isNull(conversations.project_id)),
    )
    .limit(1);
  return target?.customerId ?? null;
}

async function clearMessageBody(
  tx: ContactDatabaseTransaction,
  messageId: string,
  actor: WorkspaceActor,
) {
  const [redacted] = await tx
    .update(messages)
    .set({
      body: null,
      redacted_at: new Date(),
      redacted_by_member_id: actor.workspaceMemberId,
    })
    .where(redactableTextMessage(messageId))
    .returning();
  return redacted ?? null;
}

async function recordMessageRedaction(
  tx: ContactDatabaseTransaction,
  actor: WorkspaceActor,
  message: typeof messages.$inferSelect,
) {
  await activityService.createActivity(tx, {
    customerId: message.customer_id,
    actor: { type: ActorType.User, userId: actor.userId },
    type: ActivityType.FieldChange,
    metadata: {
      entity: MESSAGE_ACTIVITY_ENTITY,
      message_id: message.id,
      change: MessageActivityChange.Redacted,
    },
    occurredAt: message.redacted_at ?? new Date(),
  });
}

async function redactVisibleMessage(
  tx: ContactDatabaseTransaction,
  messageId: string,
  actor: WorkspaceActor,
) {
  const customerId = await findRedactableCustomerId(tx, messageId);
  if (!customerId || !canOn(actor, Permission.ChatRead, { customerId }))
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  const redacted = await clearMessageBody(tx, messageId, actor);
  if (!redacted) return { ok: false, code: MessageErrorCode.NotFound } as const;
  await recordMessageRedaction(tx, actor, redacted);
  return {
    ok: true,
    message: messageMappingService.toDto(
      redacted,
      internalConversationService.readerOf(actor),
    ),
  } as const;
}

export async function redactMessage(messageId: string, actor: WorkspaceActor) {
  if (!can(actor, Permission.ChatRedact))
    return { ok: false, code: MessageErrorCode.Forbidden } as const;
  if (!isUuid(messageId))
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction((tx) =>
    redactVisibleMessage(tx, messageId, actor),
  );
}
