import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateConversationOwnerInput } from "@invessiv/common/contracts/crm/update-conversation-owner.input";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  conversations,
  rolePermissions,
  roles,
  workspaceMemberRoles,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { activityService } from "@/server/shared/services/activity-service";
import { messageService } from "@/server/shared/services/message/message-service";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

async function memberHasGlobalChatRead(
  tx: ContactDatabaseTransaction,
  memberId: string,
): Promise<boolean> {
  const [globalGrant] = await tx
    .select({ key: rolePermissions.permission_key })
    .from(workspaceMemberRoles)
    .innerJoin(
      rolePermissions,
      eq(rolePermissions.role_id, workspaceMemberRoles.role_id),
    )
    .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
    .where(
      and(
        eq(workspaceMemberRoles.workspace_member_id, memberId),
        eq(roles.active, true),
        eq(rolePermissions.permission_key, Permission.ChatRead),
      ),
    )
    .limit(1);
  return Boolean(globalGrant);
}

async function memberHasScopedChatRead(
  tx: ContactDatabaseTransaction,
  memberId: string,
  customerId: string,
): Promise<boolean> {
  const [customerGrant] = await tx
    .select({ key: rolePermissions.permission_key })
    .from(workspaceMemberScopedRoles)
    .innerJoin(
      rolePermissions,
      eq(rolePermissions.role_id, workspaceMemberScopedRoles.role_id),
    )
    .innerJoin(roles, eq(roles.id, workspaceMemberScopedRoles.role_id))
    .where(
      and(
        eq(workspaceMemberScopedRoles.workspace_member_id, memberId),
        eq(workspaceMemberScopedRoles.customer_id, customerId),
        isNull(workspaceMemberScopedRoles.project_id),
        eq(roles.active, true),
        eq(rolePermissions.permission_key, Permission.ChatRead),
      ),
    )
    .limit(1);
  return Boolean(customerGrant);
}

async function memberCanOwnConversation(
  tx: ContactDatabaseTransaction,
  memberId: string,
  customerId: string,
): Promise<boolean> {
  const active =
    await memberResponsibilityLockService.lockActiveMemberForAssignment(
      tx,
      memberId,
    );
  if (!active) return false;
  return (
    (await memberHasGlobalChatRead(tx, memberId)) ||
    (await memberHasScopedChatRead(tx, memberId, customerId))
  );
}

function actorMayAssignConversationOwner(
  actor: WorkspaceActor,
  customerId: string,
): boolean {
  return (
    z.uuid().safeParse(customerId).success &&
    canOn(actor, Permission.ChatRead, { customerId }) &&
    canOn(actor, Permission.ChatWrite, { customerId })
  );
}

async function recordConversationOwnerChange(
  tx: ContactDatabaseTransaction,
  actor: WorkspaceActor,
  conversation: typeof conversations.$inferSelect,
  nextOwnerMemberId: string,
) {
  await activityService.createActivity(tx, {
    customerId: conversation.customer_id,
    actor: { type: ActorType.User, userId: actor.userId },
    type: ActivityType.FieldChange,
    metadata: {
      entity: "conversation",
      conversation_id: conversation.id,
      previous_owner_member_id: conversation.owner_member_id,
      next_owner_member_id: nextOwnerMemberId,
    },
    occurredAt: new Date(),
  });
}

async function assignConversationOwner(
  tx: ContactDatabaseTransaction,
  customerId: string,
  input: UpdateConversationOwnerInput,
  actor: WorkspaceActor,
) {
  const conversation = await messageService.findCustomerConversation(
    tx,
    customerId,
  );
  if (!conversation)
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  if (!(await memberCanOwnConversation(tx, input.ownerMemberId, customerId)))
    return { ok: false, code: MessageErrorCode.ValidationError } as const;

  const write = await updateVersioned({
    tx,
    table: conversations,
    id: conversation.id,
    expectedVersion: input.version,
    patch: { owner_member_id: input.ownerMemberId },
    toDto: (row) => ({
      ownerMemberId: row.owner_member_id,
      version: row.version,
    }),
  });
  if (!write.ok) {
    if (write.code === ConcurrencyErrorCode.NotFound)
      return { ok: false, code: MessageErrorCode.NotFound } as const;
    return {
      ok: false,
      code: MessageErrorCode.VersionConflict,
      conflict: write.conflict,
    } as const;
  }

  await recordConversationOwnerChange(
    tx,
    actor,
    conversation,
    input.ownerMemberId,
  );
  return {
    ok: true,
    ownerMemberId: input.ownerMemberId,
    version: write.value.version,
  } as const;
}

export async function updateConversationOwner(
  customerId: string,
  input: UpdateConversationOwnerInput,
  actor: WorkspaceActor,
) {
  if (!actorMayAssignConversationOwner(actor, customerId))
    return { ok: false, code: MessageErrorCode.NotFound } as const;

  return getDrizzleDatabaseClient().transaction((tx) =>
    assignConversationOwner(tx, customerId, input, actor),
  );
}
