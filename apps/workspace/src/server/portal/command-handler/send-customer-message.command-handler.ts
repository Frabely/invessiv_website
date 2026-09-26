import "server-only";

import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { people } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { messageMappingService } from "@/server/shared/services/message/message-mapping-service";
import { messageService } from "@/server/shared/services/message/message-service";

export async function sendCustomerMessage(actor: PortalActor, input: unknown) {
  const body = messageService.validateBody(input);
  if (!body)
    return { ok: false, code: MessageErrorCode.ValidationError } as const;
  if (
    !portalCanOn.forActor(actor, Permission.PortalMessagesRead, {
      customerId: actor.customerId,
    }) ||
    !portalCanOn.forActor(actor, Permission.PortalMessagesWrite, {
      customerId: actor.customerId,
    })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [sender] = await tx
      .select({ displayName: people.display_name })
      .from(people)
      .where(eq(people.id, actor.personId))
      .limit(1);
    if (!sender) return { ok: false, code: MessageErrorCode.NotFound } as const;
    const conversation = await messageService.ensureCustomerConversation(
      tx,
      actor.customerId,
    );
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    const message = await messageService.appendTextMessage(tx, {
      conversationId: conversation.id,
      customerId: actor.customerId,
      body,
      side: MessageSenderSide.Customer,
      memberId: null,
      portalMembershipId: actor.membershipId,
      displayName: sender.displayName,
      actorType: ActorType.Customer,
      actorUserId: actor.userId,
    });
    return {
      ok: true,
      message: messageMappingService.toDto(message, null, actor.membershipId),
    } as const;
  });
}
