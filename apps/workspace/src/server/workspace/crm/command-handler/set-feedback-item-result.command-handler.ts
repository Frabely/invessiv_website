import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { SetFeedbackItemResultRequestDto } from "@invessiv/common/contracts/crm/set-feedback-item-result-request.dto";
import type { SetFeedbackItemResultResult } from "@invessiv/common/contracts/crm/results/set-feedback-item-result-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  feedbackRoundItems,
  feedbackRounds,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

const ITEM_NOT_FOUND = {
  ok: false,
  code: FeedbackRoundErrorCode.ItemNotFound,
} as const;

/**
 * Sets the team's outcome for one item while the round is being worked on. The round is held
 * `FOR SHARE`: results of several items go in parallel, but the completion waits for them and then
 * sees every result. Results stay hidden from the customer until the round is completed.
 */
export async function setFeedbackItemResult(
  itemId: string,
  input: SetFeedbackItemResultRequestDto,
  actor: WorkspaceActor,
): Promise<SetFeedbackItemResultResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(itemId).success)
    return ITEM_NOT_FOUND;
  const parsed = feedbackRoundSchemas.setItemResult.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: FeedbackRoundErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx): Promise<SetFeedbackItemResultResult> => {
    const [target] = await tx
      .select({ item: feedbackRoundItems, round: feedbackRounds })
      .from(feedbackRoundItems)
      .innerJoin(
        feedbackRounds,
        eq(feedbackRounds.id, feedbackRoundItems.round_id),
      )
      .where(
        and(
          eq(feedbackRoundItems.id, itemId),
          crmAccessCondition.forScope(
            accessScope(actor, Permission.ProjectsWrite),
            {
              customerId: feedbackRounds.customer_id,
              projectId: feedbackRounds.project_id,
            },
          ),
        ),
      )
      .limit(1)
      .for("share", { of: feedbackRounds });
    if (
      !target ||
      !canOn(actor, Permission.ProjectsWrite, {
        customerId: target.round.customer_id,
        projectId: target.round.project_id,
      })
    )
      return ITEM_NOT_FOUND;
    if (
      !(
        RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]
      ).includes(target.round.status)
    )
      return { ok: false, code: FeedbackRoundErrorCode.RoundLocked };

    // A result write never touches files, so the attachments loaded now stay valid for the answer.
    const loaded = await feedbackRoundItemService.loadByRound(
      tx,
      [target.round.id],
      fileAccessService.readableCondition(actor),
    );
    const attachments =
      loaded.get(target.round.id)?.find(({ item }) => item.id === itemId)
        ?.attachments ?? [];
    const write = await updateVersioned({
      tx,
      table: feedbackRoundItems,
      id: itemId,
      expectedVersion: parsed.data.version,
      patch: {
        result: parsed.data.result,
        result_note: parsed.data.resultNote,
        result_set_by_member_id: actor.workspaceMemberId,
        result_set_at: new Date(),
      },
      toDto: (item) =>
        feedbackRoundMappingService.toItemDto({ item, attachments }),
    });
    if (write.ok) return { ok: true, item: write.value };
    if (write.code === ConcurrencyErrorCode.NotFound) return ITEM_NOT_FOUND;
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: write.conflict,
    };
  });
}
