import "server-only";

import type { CreateActivityInput } from "@invessiv/common/contracts/activity/create-activity-input";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { activities } from "@invessiv/db/record-configuration";
import { activityActorMappingService } from "@/server/workspace/shared/services/activity-actor-mapping-service";

async function createActivity(
  tx: ContactDatabaseTransaction,
  input: CreateActivityInput,
): Promise<void> {
  const now = new Date();

  await tx.insert(activities).values({
    id: crypto.randomUUID(),
    lead_id: input.leadId ?? null,
    customer_id: input.customerId ?? null,
    project_id: input.projectId ?? null,
    type: input.type,
    title: input.title ?? null,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    occurred_at: input.occurredAt ?? now,
    ...activityActorMappingService.mapActorToColumns(input.actor),
    actor_id: null,
    actor_label: null,
    created_at: now,
  });
}

async function appendActivity(input: CreateActivityInput): Promise<void> {
  const db = getDrizzleDatabaseClient();
  await db.transaction((tx) => createActivity(tx, input));
}

export const activityService = {
  appendActivity,
  createActivity,
} as const;
