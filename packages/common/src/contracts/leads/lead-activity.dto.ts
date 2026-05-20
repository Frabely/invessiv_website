import type { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import type { LeadActorType } from "@invessiv/common/constants/leads/activity/lead-actor-types";

export interface LeadActivityDto {
  id: string;
  type: LeadActivityType;
  title: string | null;
  body: string | null;
  metadata: unknown;
  occurredAt: string;
  actorType: LeadActorType;
  actorId: string | null;
  actorLabel: string | null;
}
