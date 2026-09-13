import type { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";

type ActivitySubject =
  | { leadId: string; customerId?: string | null }
  | { leadId?: string | null; customerId: string };

export type CreateActivityInput = ActivitySubject & {
  projectId?: string | null;
  type: ActivityType;
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
  actor: ActivityActor;
};
