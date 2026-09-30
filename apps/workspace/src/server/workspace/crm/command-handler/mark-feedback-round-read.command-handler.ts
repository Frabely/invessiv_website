import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { MarkFeedbackRoundReadResult } from "@invessiv/common/contracts/crm/results/mark-feedback-round-read-result";
import type { MarkFeedbackRoundReadRequestDto } from "@invessiv/common/contracts/crm/mark-feedback-round-read-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { feedbackInboxService } from "@/server/workspace/crm/services/feedback/feedback-inbox-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";

const ROUND_NOT_FOUND = {
  ok: false,
  code: FeedbackRoundErrorCode.RoundNotFound,
} as const;

/** Reading is not a status change: the round keeps its status, version and activity log. */
export async function markFeedbackRoundRead(
  roundId: string,
  input: MarkFeedbackRoundReadRequestDto,
  actor: WorkspaceActor,
): Promise<MarkFeedbackRoundReadResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(roundId).success)
    return ROUND_NOT_FOUND;
  const db = getDrizzleDatabaseClient();
  const round = await feedbackInboxService.findReadable(db, roundId, actor);
  if (
    !round ||
    !canOn(actor, Permission.ProjectsRead, {
      customerId: round.customerId,
      projectId: round.projectId,
    })
  )
    return ROUND_NOT_FOUND;
  return {
    ok: true,
    marked: await feedbackInboxService.markRead(db, round.id, input.version),
  };
}
