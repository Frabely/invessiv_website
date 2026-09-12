import type { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { ActorType } from "@invessiv/common/constants/activity/actor-types";

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
  actorType: ActorType;
  actorId?: string | null;
  actorLabel?: string | null;
};
