import "server-only";

import { count, eq } from "drizzle-orm";
import {
  OWNABLE_ENTITY_VALUES,
  OwnableEntity,
  type OwnableEntity as OwnableEntityValue,
} from "@invessiv/common/constants/crm/ownable-entities";
import type { OwnershipResponsibilityCountsDto } from "@invessiv/common/contracts/auth/ownership-responsibility-counts.dto";
import { conversations } from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { customerResponsibilityCounterService } from "@/server/workspace/access/services/responsibilities/customer-responsibility-counter";
import { taskResponsibilityCounterService } from "@/server/workspace/access/services/responsibilities/task-responsibility-counter";

type ResponsibilityCounter = (
  executor: AccessDatabaseExecutor,
  memberId: string,
) => Promise<number>;

async function countOpenConversationResponsibilities(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<number> {
  const [row] = await executor
    .select({ count: count() })
    .from(conversations)
    .where(eq(conversations.owner_member_id, memberId));
  return row?.count ?? 0;
}

const RESPONSIBILITY_COUNTERS = {
  [OwnableEntity.Customer]: customerResponsibilityCounterService.countOpen,
  [OwnableEntity.Task]: taskResponsibilityCounterService.countOpen,
  [OwnableEntity.Conversation]: countOpenConversationResponsibilities,
} satisfies Record<OwnableEntityValue, ResponsibilityCounter>;

async function countOpenByMemberId(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<OwnershipResponsibilityCountsDto> {
  const entries = await Promise.all(
    OWNABLE_ENTITY_VALUES.map(
      async (entity) =>
        [
          entity,
          await RESPONSIBILITY_COUNTERS[entity](executor, memberId),
        ] as const,
    ),
  );

  const counts = {
    [OwnableEntity.Customer]: 0,
    [OwnableEntity.Task]: 0,
    [OwnableEntity.Conversation]: 0,
  } satisfies OwnershipResponsibilityCountsDto;

  for (const [entity, count] of entries) {
    counts[entity] = count;
  }

  return counts;
}

export const responsibilityCounterService = {
  countOpenByMemberId,
} as const;
