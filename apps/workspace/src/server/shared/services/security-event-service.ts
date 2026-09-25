import "server-only";

import type { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import type { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { securityEvents } from "@invessiv/db/record-configuration";
import { activityActorMappingService } from "@/server/workspace/shared/services/activity-actor/activity-actor-mapping-service";

type CreateSecurityEventInput = {
  type: SecurityEventType;
  actor: ActivityActor;
  subjectType: SecuritySubjectType;
  subjectId: string;
  /** Must never contain secrets, tokens or unnecessary PII. */
  metadata?: Record<string, unknown> | null;
  occurredAt: Date;
};

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
