import type { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { ActorType } from "@invessiv/common/constants/activity/actor-types";

export type ActivityRow = {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  project_id: string | null;
  type: ActivityType;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: Date;
  actor_type: ActorType;
  actor_id: string | null;
  actor_label: string | null;
};
