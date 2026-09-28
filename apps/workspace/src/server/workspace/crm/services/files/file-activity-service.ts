import "server-only";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { activityService } from "@/server/shared/services/activity-service";

async function record(
  tx: ContactDatabaseTransaction,
  row: typeof files.$inferSelect,
  actor: WorkspaceActor,
  type: ActivityType,
  fields?: string[],
) {
  await activityService.createActivity(tx, {
    customerId: row.customer_id,
    projectId: row.project_id,
    actor: { type: ActorType.User, userId: actor.userId },
    type,
    // Free text, URLs, keys and filenames must never enter the append-only timeline.
    metadata: {
      entity: "file",
      file_id: row.id,
      ...(fields ? { fields } : {}),
    },
  });
}

async function recordChanges(
  tx: ContactDatabaseTransaction,
  before: typeof files.$inferSelect,
  after: typeof files.$inferSelect,
  actor: WorkspaceActor,
) {
  for (const field of ["note", "visible_to_customer", "project_id"] as const) {
    if (before[field] !== after[field])
      await record(tx, after, actor, ActivityType.FieldChange, [field]);
  }
}

export const fileActivityService = { record, recordChanges };
