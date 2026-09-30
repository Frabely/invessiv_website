import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { feedbackRounds } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { feedbackRoundService } from "@/server/workspace/crm/services/feedback/feedback-round-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/** One round with items, attachments and results, or null when it is out of reach. */
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
  return round ? feedbackRoundService.toRoundDto(db, round, actor) : null;
}
