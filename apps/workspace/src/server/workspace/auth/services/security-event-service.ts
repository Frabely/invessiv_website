import "server-only";

import type { CreateSecurityEventInput } from "@invessiv/common/contracts/auth/create-security-event-input";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { securityEvents } from "@invessiv/db/record-configuration";
import { activityActorMappingService } from "@/server/workspace/shared/services/activity-actor-mapping-service";

/** Append-only: there is deliberately no update or delete path. */
async function createSecurityEvent(
  tx: ContactDatabaseTransaction,
  input: CreateSecurityEventInput,
): Promise<void> {
  await tx.insert(securityEvents).values({
    id: crypto.randomUUID(),
    type: input.type,
    ...activityActorMappingService.mapActorToColumns(input.actor),
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    metadata: input.metadata ?? null,
    occurred_at: input.occurredAt,
  });
}

export const securityEventService = {
  createSecurityEvent,
} as const;
