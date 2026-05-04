import type { LeadActivityType } from "@/common/constants/leads/lead-activity-types";
import type { LeadActorType } from "@/common/constants/leads/lead-actor-types";

export type LeadActivityRow = {
  id: string;
  type: LeadActivityType;
  title: string | null;
  body: string | null;
  metadata: unknown;
  occurred_at: Date;
  actor_type: LeadActorType;
  actor_id: string | null;
  actor_label: string | null;
};
