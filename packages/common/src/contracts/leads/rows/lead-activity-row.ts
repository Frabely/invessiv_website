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
  /** Legacy provider id; new human rows carry `actor_user_id` instead. */
  actor_id: string | null;
  /** Legacy label captured at write time. */
  actor_label: string | null;
  /** Null for system rows and for rows migrated from `lead_activities`. */
  actor_user_id: string | null;
  /** Current `users.display_name` joined through `actor_user_id`, so renames show everywhere. */
  actor_display_name: string | null;
};
