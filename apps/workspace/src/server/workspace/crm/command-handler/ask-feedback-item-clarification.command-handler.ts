import "server-only";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import type { AskFeedbackItemClarificationRequestDto } from "@invessiv/common/contracts/crm/ask-feedback-item-clarification-request.dto";
import type { AskFeedbackItemClarificationResult } from "@invessiv/common/contracts/crm/results/ask-feedback-item-clarification-result";
import { getDrizzleDatabaseClient, PostgresErrorCode } from "@invessiv/db/core";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { FeedbackRoundItemClarificationsConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-round-item-clarifications-constraint-names";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { FeedbackItemWriteConflictError } from "@/server/shared/services/feedback/feedback-item-write-conflict-error.class";
import { feedbackClarificationService as questions } from "@/server/shared/services/feedback/feedback-clarification-service";
import { feedbackResultHistoryService } from "@/server/shared/services/feedback/feedback-result-history-service";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type {
  FeedbackRoundItemRow,
  FeedbackRoundRow,
} from "@/server/shared/services/feedback/feedback-service-types";
import { feedbackItemProcessingService as items } from "@/server/workspace/crm/services/feedback/feedback-item-processing-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

const NOT_FOUND = { ok: false, code: E.ItemNotFound } as const;

type AskContext = {
  tx: ContactDatabaseTransaction;
  actor: WorkspaceActor;
  round: FeedbackRoundRow;
  projectTitle: string;
  item: FeedbackRoundItemRow;
  request: AskFeedbackItemClarificationRequestDto;
};

export async function askFeedbackItemClarification(
  rawItemId: string,
  input: AskFeedbackItemClarificationRequestDto,
  actor: WorkspaceActor,
): Promise<AskFeedbackItemClarificationResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(rawItemId).success)
    return NOT_FOUND;
  const parsed = feedbackRoundSchemas.askClarification.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: E.ValidationError, errors: parsed.error.issues };
  const itemId = rawItemId.toLowerCase();
  const request = parsed.data;
  return getDrizzleDatabaseClient().transaction(
    async (tx): Promise<AskFeedbackItemClarificationResult> => {
      const target = await items.lock(tx, itemId, actor);
      if (!target) return NOT_FOUND;
      const { item, round, projectTitle } = target;
      const context: AskContext = {
        tx,
        actor,
        round,
        projectTitle,
        item,
        request,
      };
      const replay = await resolveCommandReplay(context);
      if (replay) return replay;
      const rejection = await rejectUnlessClarificationAllowed(context);
      if (rejection) return rejection;
      try {
        const next = await insertClarification(context);
        return next
          ? { ok: true, item: await items.loadItemDto(tx, next, actor) }
          : { ok: false, code: E.CommandIdReused };
      } catch (error) {
        return recoverWriteConflict(context, error);
      }
    },
  );
}

async function resolveCommandReplay(
  context: AskContext,
): Promise<AskFeedbackItemClarificationResult | null> {
  const { tx, actor, item, request } = context;
  const replay = await questions.inspectCommand(tx, item.id, {
    status: FeedbackClarificationStatus.Open,
    commandId: request.commandId,
    actorId: actor.workspaceMemberId,
    version: request.version,
    text: request.question,
  });
  if (replay.seen) {
    if (!replay.matches) return { ok: false, code: E.CommandIdReused };
    return { ok: true, item: await items.loadItemDto(tx, item, actor) };
  }
  if (await questions.hasQuestionId(tx, request.commandId))
    return { ok: false, code: E.CommandIdReused };
  return null;
}

async function rejectUnlessClarificationAllowed(
  context: AskContext,
): Promise<AskFeedbackItemClarificationResult | null> {
  const { tx, actor, round, item, request } = context;
  const isRoundEditable = RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES.some(
    (status) => status === round.status,
  );
  if (!isRoundEditable) return { ok: false, code: E.RoundLocked };
  if (request.version !== item.version)
    return versionConflict(
      item.version,
      await items.loadItemDto(tx, item, actor),
    );
  if (await questions.findOpen(tx, item.id))
    return {
      ok: false,
      code: E.ClarificationOpen,
      item: await items.loadItemDto(tx, item, actor),
    };
  return null;
}

async function insertClarification(
  context: AskContext,
): Promise<FeedbackRoundItemRow | null> {
  const { tx, actor, round, projectTitle, item, request } = context;
  return tx.transaction(async (savepoint) => {
    const inserted = await questions.insertOpen(savepoint, {
      itemId: item.id,
      question: request.question,
      memberId: actor.workspaceMemberId,
      commandId: request.commandId,
      requestVersion: request.version,
      now: new Date(),
    });
    if (!inserted) return null;
    const updated = await questions.writeItem(savepoint, item, true);
    await feedbackResultHistoryService.recordChange(savepoint, {
      stored: item,
      next: updated,
      actor: {
        side: FeedbackResultActorSide.Member,
        memberId: actor.workspaceMemberId,
      },
      command: {
        commandId: request.commandId,
        requestVersion: request.version,
      },
    });
    await feedbackRoundWriteService.announceItemEvent(
      savepoint,
      round,
      projectTitle,
      SystemMessageKey.FeedbackClarificationRequested,
      item.position,
    );
    return updated;
  });
}

async function recoverWriteConflict(
  context: AskContext,
  error: unknown,
): Promise<AskFeedbackItemClarificationResult> {
  const { tx, actor, item } = context;
  const isVersionConflict = error instanceof FeedbackItemWriteConflictError;
  const isOpenClarificationConflict =
    postgresErrorService.getViolatedConstraint(
      error,
      PostgresErrorCode.UniqueViolation,
    ) === N.OpenItemUnique;
  const isExpectedConflict = isVersionConflict || isOpenClarificationConflict;
  if (!isExpectedConflict) throw error;
  const current = await items.readLocked(tx, item.id);
  if (!current) return NOT_FOUND;
  if (isVersionConflict)
    return versionConflict(
      current.version,
      await items.loadItemDto(tx, current, actor),
    );
  return {
    ok: false,
    code: E.ClarificationOpen,
    item: await items.loadItemDto(tx, current, actor),
  };
}
