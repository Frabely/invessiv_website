import type { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { ActorType } from "@invessiv/common/constants/activity/actor-types";

export type LeadActivityRow = {
  id: string;
  type: ActivityType;
  title: string | null;
  body: string | null;
  metadata: unknown;
  occurred_at: Date;
  actor_type: ActorType;
  actor_id: string | null;
  actor_label: string | null;
};
