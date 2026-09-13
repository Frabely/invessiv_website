import type { LegacyLeadActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { LegacyLeadActorType } from "@invessiv/common/constants/activity/actor-types";

export interface LeadActivityDto {
  id: string;
  type: LegacyLeadActivityType;
  title: string | null;
  body: string | null;
  metadata: unknown;
  occurredAt: string;
  actorType: LegacyLeadActorType;
  actorId: string | null;
  actorLabel: string | null;
}
