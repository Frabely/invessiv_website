import "server-only";

import { z } from "zod";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { activityService } from "@/server/shared/services/activity-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { conversationService } from "@/server/workspace/crm/services/conversation-service";

async function recordMessageRedaction(
  tx: ContactDatabaseTransaction,
  actor: WorkspaceActor,
  customerId: string,
  messageId: string,
  at: Date,
) {
  await activityService.createActivity(tx, {
    customerId,
    actor: { type: ActorType.User, userId: actor.userId },
    type: ActivityType.FieldChange,
    metadata: { entity: "message", message_id: messageId, change: "redacted" },
    occurredAt: at,
  });
}

async function redactAuthorizedMessage(
  tx: ContactDatabaseTransaction,
  messageId: string,
  actor: WorkspaceActor,
) {
  if (
    !(await conversationService.memberIsWorkspaceOwner(
      tx,
      actor.workspaceMemberId,
    ))
  )
    return { ok: false, code: MessageErrorCode.Forbidden } as const;

  const target = await messageService.findRedactableTextMessage(tx, messageId);
  if (
    !target ||
    !canOn(actor, Permission.ChatRead, { customerId: target.customerId })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;

  const now = new Date();
  const redacted = await messageService.redactTextMessage(
    tx,
    messageId,
    target,
    actor.workspaceMemberId,
    now,
  );
  if (!redacted) return { ok: false, code: MessageErrorCode.NotFound } as const;

  await recordMessageRedaction(tx, actor, target.customerId, messageId, now);
  return { ok: true } as const;
}

export async function redactMessage(messageId: string, actor: WorkspaceActor) {
  if (!z.uuid().safeParse(messageId).success)
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction((tx) =>
    redactAuthorizedMessage(tx, messageId, actor),
  );
}
