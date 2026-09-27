import "server-only";

import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { SendMessageInput } from "@invessiv/common/contracts/crm/send-message.input";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { people } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
import { messageService } from "@/server/shared/services/message/message-service";

async function getSenderDisplayName(
  tx: ContactDatabaseTransaction,
  personId: string,
): Promise<string | null> {
  const [sender] = await tx
    .select({ displayName: people.display_name })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);
  return sender?.displayName ?? null;
}

async function getRetryState(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  input: SendMessageInput,
  conversationId: string,
) {
  // The quota check locks the membership before we look for an earlier successful send.
  const retryAfterSeconds = await messageService.findPortalSendRetryAfter(
    tx,
    actor.membershipId,
  );
  const existing = await messageService.findMatchingTextMessage(tx, {
    clientMessageId: input.clientMessageId,
    conversationId,
    body: input.body,
    side: MessageSenderSide.Customer,
    memberId: null,
    portalMembershipId: actor.membershipId,
  });
  return { existing, retryAfterSeconds };
}

export async function sendCustomerMessage(
  actor: PortalActor,
  input: SendMessageInput,
) {
  if (
    !portalCanOn.forActor(actor, Permission.PortalMessagesWrite, {
      customerId: actor.customerId,
    })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const conversation = await messageService.ensureCustomerConversation(
      tx,
      actor.customerId,
    );
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const { existing, retryAfterSeconds } = await getRetryState(
      tx,
      actor,
      input,
      conversation.id,
    );
    if (existing)
      return {
        ok: true,
        message: messageMappingService.toDto(
          existing,
          null,
          actor.membershipId,
        ),
      } as const;
    if (retryAfterSeconds !== null)
      return {
        ok: false,
        code: MessageErrorCode.RateLimited,
        retryAfterSeconds,
      } as const;
    const senderDisplayName = await getSenderDisplayName(tx, actor.personId);
    if (!senderDisplayName)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const message = await messageService.appendTextMessage(tx, {
      clientMessageId: input.clientMessageId,
      conversationId: conversation.id,
      customerId: actor.customerId,
      body: input.body,
      side: MessageSenderSide.Customer,
      memberId: null,
      portalMembershipId: actor.membershipId,
      displayName: senderDisplayName,
      actorType: ActorType.Customer,
      actorUserId: actor.userId,
    });
    if (!message)
      return { ok: false, code: MessageErrorCode.ValidationError } as const;
    return {
      ok: true,
      message: messageMappingService.toDto(message, null, actor.membershipId),
    } as const;
  });
}
