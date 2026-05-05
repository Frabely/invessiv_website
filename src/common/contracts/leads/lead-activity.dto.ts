import type { LeadActivityType } from "@/common/constants/leads/lead-activity-types";
import type { LeadActorType } from "@/common/constants/leads/lead-actor-types";

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
