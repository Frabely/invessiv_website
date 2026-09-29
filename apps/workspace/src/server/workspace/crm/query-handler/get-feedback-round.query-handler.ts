import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { feedbackRounds } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/**
 * One round with items, attachments and results. Attachments follow the member's own file scope,
 * so `projects.read` without `files.read` shows the items but no files.
 */
export async function getFeedbackRound(
  roundId: string,
  actor: WorkspaceActor,
): Promise<FeedbackRoundDto | null> {
  if (!feedbackRoundSchemas.entityId.safeParse(roundId).success) return null;
  const db = getDrizzleDatabaseClient();
  const [round] = await db
    .select()
    .from(feedbackRounds)
    .where(
      and(
        eq(feedbackRounds.id, roundId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsRead),
          {
            customerId: feedbackRounds.customer_id,
            projectId: feedbackRounds.project_id,
          },
        ),
      ),
    )
    .limit(1);
  if (!round) return null;

  const items = await feedbackRoundItemService.loadByRound(
    db,
    [round.id],
    fileAccessService.readableCondition(actor),
  );
  return feedbackRoundMappingService.toDto(round, items.get(round.id) ?? []);
}
