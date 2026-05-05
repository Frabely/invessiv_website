import "server-only";
import type { ContactDatabaseTransaction } from "@/server/db/core";
import { leadActivities } from "@/server/db/record-configuration";
import type { CreateLeadActivityInput } from "@/common/contracts/leads/create-lead-activity-input";

export async function createLeadActivity(
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
