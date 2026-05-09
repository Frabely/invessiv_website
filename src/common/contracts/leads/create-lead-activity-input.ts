import type { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import type { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";

export type CreateLeadActivityInput = {
  leadId: string;
  type: LeadActivityType;
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  actorType: LeadActorType;
  actorId?: string | null;
  actorLabel?: string | null;
};
