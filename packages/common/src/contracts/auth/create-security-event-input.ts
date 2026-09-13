import type { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import type { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";

export type CreateSecurityEventInput = {
  type: SecurityEventType;
  actor: ActivityActor;
  subjectType: SecuritySubjectType;
  subjectId: string;
  /** Must never contain secrets, tokens or unnecessary PII. */
  metadata?: Record<string, unknown> | null;
  occurredAt: Date;
};
