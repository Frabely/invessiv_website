import "server-only";
import type { ContactDatabaseTransaction } from "@/server/db/core";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leadActivities } from "@/server/db/record-configuration";
import type { CreateLeadActivityInput } from "@/common/contracts/leads/create-lead-activity-input";

async function createLeadActivity(
  tx: ContactDatabaseTransaction,
  input: CreateLeadActivityInput,
): Promise<void> {
  const now = new Date();
  await tx.insert(leadActivities).values({
    id: crypto.randomUUID(),
    lead_id: input.leadId,
    type: input.type,
    title: input.title ?? null,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    occurred_at: now,
    actor_type: input.actorType,
    actor_id: input.actorId ?? null,
    actor_label: input.actorLabel ?? null,
    created_at: now,
  });
}

async function appendLeadActivity(
  input: CreateLeadActivityInput,
): Promise<void> {
  const db = getDrizzleDatabaseClient();
  const now = new Date();
  await db.insert(leadActivities).values({
    id: crypto.randomUUID(),
    lead_id: input.leadId,
    type: input.type,
    title: input.title ?? null,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    occurred_at: now,
    actor_type: input.actorType,
    actor_id: input.actorId ?? null,
    actor_label: input.actorLabel ?? null,
    created_at: now,
  });
}

export const leadActivityService = {
  appendLeadActivity,
  createLeadActivity,
} as const;
