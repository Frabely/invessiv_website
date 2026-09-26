import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { messageService } from "@/server/shared/services/message/message-service";

export async function markConversationRead(
  customerId: string,
  actor: WorkspaceActor,
) {
  if (
    !z.uuid().safeParse(customerId).success ||
    !canOn(actor, Permission.ChatRead, { customerId })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [conversation] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.customer_id, customerId),
          isNull(conversations.project_id),
        ),
      )
      .limit(1);
    if (!conversation)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    await messageService.markConversationRead(
      tx,
      conversation.id,
      actor.workspaceMemberId,
      null,
    );
    return { ok: true } as const;
  });
}
