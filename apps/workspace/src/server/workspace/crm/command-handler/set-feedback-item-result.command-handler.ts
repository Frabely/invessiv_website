import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
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
import { feedbackResultHistoryService } from "@/server/shared/services/feedback/feedback-result-history-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import type { FeedbackRoundItemRow } from "@/server/shared/services/feedback/feedback-service-types";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

const ITEM_NOT_FOUND = {
  ok: false,
  code: FeedbackRoundErrorCode.ItemNotFound,
} as const;

class FeedbackItemWriteConflictError extends Error {}

/**
 * Sets the team's outcome for one item while the round is being worked on. The round is held
 * `FOR SHARE`: results of several items go in parallel, but the completion waits for them and then
 * sees every result. Results stay hidden from the customer until the round is completed.
 */
export async function setFeedbackItemResult(
  rawItemId: string,
  input: SetFeedbackItemResultRequestDto,
  actor: WorkspaceActor,
): Promise<SetFeedbackItemResultResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(rawItemId).success)
    return ITEM_NOT_FOUND;
  const itemId = rawItemId.toLowerCase();
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
    const [stored] = await tx
      .select()
      .from(feedbackRoundItems)
      .where(eq(feedbackRoundItems.id, itemId))
      .for("update");
    if (!stored) return ITEM_NOT_FOUND;
    const request = parsed.data;
    const commandId = request.commandId ?? randomUUID();
    // A result write never touches files, so the attachments loaded now stay valid for every answer.
    const loaded = await feedbackRoundItemService.loadByRound(
      tx,
      [target.round.id],
      fileAccessService.readableCondition(actor),
    );
    const attachments =
      loaded.get(target.round.id)?.find(({ item }) => item.id === itemId)
        ?.attachments ?? [];
    const toDto = async (item: FeedbackRoundItemRow) => {
      const history = await feedbackResultHistoryService.loadByItems(tx, [
        itemId,
      ]);
      return feedbackRoundMappingService.toItemDto(
        { item, attachments },
        history.get(itemId) ?? [],
      );
    };
    // A replay answers before the status check, so a retry after completion stays idempotent.
    const replay = await feedbackResultHistoryService.findByCommand(
      tx,
      itemId,
      commandId,
    );
    if (replay) {
      if (
        !feedbackResultHistoryService.matchesCommand(replay, {
          memberId: actor.workspaceMemberId,
          version: request.version,
          result: request.result,
          resultNote: request.resultNote,
        })
      )
        return { ok: false, code: FeedbackRoundErrorCode.CommandIdReused };
      return { ok: true, item: await toDto(stored) };
    }
    if (
      !(
        RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]
      ).includes(target.round.status)
    )
      return { ok: false, code: FeedbackRoundErrorCode.RoundLocked };
    if (request.version !== stored.version)
      return versionConflict(stored.version, await toDto(stored));
    if (
      request.result === stored.result &&
      request.resultNote === (stored.result_note?.trim() || null)
    )
      return { ok: true, item: await toDto(stored) };

    // The conflict aborts only this savepoint; no history can survive a failed versioned write.
    try {
      const next = await tx.transaction(async (savepoint) => {
        const write = await updateVersioned({
          tx: savepoint,
          table: feedbackRoundItems,
          id: itemId,
          expectedVersion: request.version,
          patch: {
            result: request.result,
            result_note: request.resultNote,
            result_set_by_member_id:
              request.result === null ? null : actor.workspaceMemberId,
            result_set_at: request.result === null ? null : new Date(),
          },
          toDto: (row) => row,
        });
        if (!write.ok) throw new FeedbackItemWriteConflictError();
        await feedbackResultHistoryService.recordChange(savepoint, {
          stored,
          next: write.value,
          actor: {
            side: FeedbackResultActorSide.Member,
            memberId: actor.workspaceMemberId,
          },
          command: { commandId, requestVersion: request.version },
        });
        return write.value;
      });
      return { ok: true, item: await toDto(next) };
    } catch (error) {
      if (!(error instanceof FeedbackItemWriteConflictError)) throw error;
      const [current] = await tx
        .select()
        .from(feedbackRoundItems)
        .where(eq(feedbackRoundItems.id, itemId));
      if (!current) return ITEM_NOT_FOUND;
      return versionConflict(current.version, await toDto(current));
    }
  });
}
