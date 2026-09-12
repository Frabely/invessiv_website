import type { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { ActorType } from "@invessiv/common/constants/activity/actor-types";

export interface ActivityDto {
  /** Stable activity id; activities migrated from `lead_activities` keep their original id. */
  id: string;
  /** Associated lead, or null for an activity that belongs only to a customer. */
  leadId: string | null;
  /** Associated customer, or null until a lead is converted or for lead-only history. */
  customerId: string | null;
  /** Associated project; no foreign key exists until the projects schema is introduced. */
  projectId: string | null;
  /** Machine-readable event kind used by timeline renderers and reporting. */
  type: ActivityType;
  /** Optional short heading when the event needs more context than its type supplies. */
  title: string | null;
  /** Optional human-readable event detail; it must never contain secrets. */
  body: string | null;
  /** Optional structured event data; it must never contain secrets or unnecessary PII. */
  metadata: Record<string, unknown> | null;
  /** ISO timestamp controlling chronological timeline placement. */
  occurredAt: string;
  /** Kind of actor responsible for the event. */
  actorType: ActorType;
  /** Provider or application actor id; null for unattributed system events. */
  actorId: string | null;
  /** Historical display label; null when no useful label was captured. */
  actorLabel: string | null;
}
