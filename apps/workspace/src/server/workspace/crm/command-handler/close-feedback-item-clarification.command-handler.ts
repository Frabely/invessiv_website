import "server-only";

import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackClarificationStatus as S } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { CloseFeedbackItemClarificationRequestDto } from "@invessiv/common/contracts/crm/close-feedback-item-clarification-request.dto";
import type { CloseFeedbackItemClarificationResult } from "@invessiv/common/contracts/crm/results/close-feedback-item-clarification-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { FeedbackItemWriteConflictError } from "@/server/shared/services/feedback/feedback-item-write-conflict-error.class";
import { feedbackClarificationService as questions } from "@/server/shared/services/feedback/feedback-clarification-service";
import type {
  FeedbackClarificationRow,
  FeedbackRoundItemRow,
  FeedbackRoundRow,
} from "@/server/shared/services/feedback/feedback-service-types";
import { feedbackItemProcessingService as items } from "@/server/workspace/crm/services/feedback/feedback-item-processing-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

const NOT_FOUND = { ok: false, code: E.ItemNotFound } as const;

type CloseContext = {
  tx: ContactDatabaseTransaction;
  actor: WorkspaceActor;
  round: FeedbackRoundRow;
  item: FeedbackRoundItemRow;
  clarification: FeedbackClarificationRow;
  request: CloseFeedbackItemClarificationRequestDto;
};

export async function closeFeedbackItemClarification(
  rawItemId: string,
  rawClarificationId: string,
  input: CloseFeedbackItemClarificationRequestDto,
  actor: WorkspaceActor,
): Promise<CloseFeedbackItemClarificationResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(rawItemId).success)
    return NOT_FOUND;
  if (!feedbackRoundSchemas.entityId.safeParse(rawClarificationId).success)
    return { ok: false, code: E.ClarificationNotFound };
  const parsed = feedbackRoundSchemas.closeClarification.safeParse(input);
  if (!parsed.success)
    return { ok: false, code: E.ValidationError, errors: parsed.error.issues };
  const itemId = rawItemId.toLowerCase();
  const clarificationId = rawClarificationId.toLowerCase();
  const request = parsed.data;
  return getDrizzleDatabaseClient().transaction(
    async (tx): Promise<CloseFeedbackItemClarificationResult> => {
      const target = await items.lock(tx, itemId, actor);
      if (!target) return NOT_FOUND;
      const { item, round } = target;
      const clarification = await questions.findById(
        tx,
        itemId,
        clarificationId,
      );
      if (!clarification) return { ok: false, code: E.ClarificationNotFound };
      const context: CloseContext = {
        tx,
        actor,
        round,
        item,
        clarification,
        request,
      };
      const replay = await resolveCommandReplay(context);
      if (replay) return replay;
      const rejection = await rejectUnlessClosable(context);
      if (rejection) return rejection;
      return saveClosure(context);
    },
  );
}

async function resolveCommandReplay(
  context: CloseContext,
): Promise<CloseFeedbackItemClarificationResult | null> {
  const { tx, actor, item, clarification, request } = context;
  const replay = await questions.inspectCommand(tx, item.id, {
    status: S.Closed,
    commandId: request.commandId,
    actorId: actor.workspaceMemberId,
    version: request.version,
    text: request.note,
  });
  if (!replay.seen) return null;
  const isSameClosure =
    replay.matches && clarification.close_command_id === request.commandId;
  if (!isSameClosure) return { ok: false, code: E.CommandIdReused };
  return { ok: true, item: await items.loadItemDto(tx, item, actor) };
}

async function rejectUnlessClosable(
  context: CloseContext,
): Promise<CloseFeedbackItemClarificationResult | null> {
  const { tx, actor, round, item, clarification, request } = context;
  const isRoundEditable = RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES.some(
    (status) => status === round.status,
  );
  if (!isRoundEditable) return { ok: false, code: E.RoundLocked };
  if (request.version !== item.version)
    return versionConflict(
      item.version,
      await items.loadItemDto(tx, item, actor),
    );
  if (clarification.status !== S.Open)
    return {
      ok: false,
      code: E.ClarificationNotOpen,
      item: await items.loadItemDto(tx, item, actor),
    };
  return null;
}

async function saveClosure(
  context: CloseContext,
): Promise<CloseFeedbackItemClarificationResult> {
  const { tx, actor, item, clarification, request } = context;
  try {
    const next = await tx.transaction(async (savepoint) => {
      await questions.close(savepoint, {
        clarification,
        note: request.note,
        memberId: actor.workspaceMemberId,
        commandId: request.commandId,
        requestVersion: request.version,
        now: new Date(),
      });
      return questions.writeItem(savepoint, item, false);
    });
    return { ok: true, item: await items.loadItemDto(tx, next, actor) };
  } catch (error) {
    if (!(error instanceof FeedbackItemWriteConflictError)) throw error;
    const current = await items.readLocked(tx, item.id);
    return current
      ? versionConflict(
          current.version,
          await items.loadItemDto(tx, current, actor),
        )
      : NOT_FOUND;
  }
}
