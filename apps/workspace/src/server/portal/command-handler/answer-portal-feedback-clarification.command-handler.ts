import "server-only";

import { and, eq } from "drizzle-orm";
import { FeedbackClarificationStatus as S } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { PortalFeedbackErrorCode as E } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { AnswerPortalFeedbackClarificationRequestDto } from "@invessiv/common/contracts/portal/answer-portal-feedback-clarification-request.dto";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { feedbackRoundItems } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { feedbackClarificationService as questions } from "@/server/shared/services/feedback/feedback-clarification-service";
import { FeedbackItemWriteConflictError } from "@/server/shared/services/feedback/feedback-item-write-conflict-error.class";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type {
  FeedbackClarificationRow,
  FeedbackRoundItemRow,
  FeedbackRoundRow,
} from "@/server/shared/services/feedback/feedback-service-types";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

type AnswerResult = PortalFeedbackResult<
  PortalFeedbackItemDto,
  PortalFeedbackItemDto
>;

type AnswerContext = {
  tx: ContactDatabaseTransaction;
  actor: PortalActor;
  round: FeedbackRoundRow;
  projectTitle: string;
  item: FeedbackRoundItemRow;
  clarification: FeedbackClarificationRow;
  request: AnswerPortalFeedbackClarificationRequestDto;
};

export async function answerPortalFeedbackClarification(
  actor: PortalActor,
  rawRoundId: string,
  rawItemId: string,
  rawClarificationId: string,
  input: AnswerPortalFeedbackClarificationRequestDto,
): Promise<AnswerResult> {
  const ids = [rawRoundId, rawItemId, rawClarificationId].map((id) =>
    portalFeedbackSchemas.id.safeParse(id),
  );
  if (ids.some((id) => !id.success)) return portalFeedbackService.notFound();
  const [roundId, itemId, clarificationId] = [
    rawRoundId,
    rawItemId,
    rawClarificationId,
  ].map((id) => id.toLowerCase());
  const parsed = portalFeedbackSchemas.answerClarification.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const request = parsed.data;
  return portalFeedbackService.withLockedRound<
    PortalFeedbackItemDto,
    PortalFeedbackItemDto
  >(actor, roundId, async (tx, { round, projectTitle }) => {
    const [item] = await itemQuery(tx, round.id, itemId).for("update");
    if (!item) return portalFeedbackService.notFound();
    const clarification = await questions.findById(tx, itemId, clarificationId);
    if (!clarification) return portalFeedbackService.notFound();
    const context: AnswerContext = {
      tx,
      actor,
      round,
      projectTitle,
      item,
      clarification,
      request,
    };
    const replay = await resolveCommandReplay(context);
    if (replay) return replay;
    const rejection = await rejectUnlessAnswerable(context);
    if (rejection) return rejection;
    return saveAnswer(context);
  });
}

function itemQuery(
  tx: ContactDatabaseTransaction,
  roundId: string,
  itemId: string,
) {
  return tx
    .select()
    .from(feedbackRoundItems)
    .where(
      and(
        eq(feedbackRoundItems.id, itemId),
        eq(feedbackRoundItems.round_id, roundId),
      ),
    );
}

async function resolveCommandReplay(
  context: AnswerContext,
): Promise<AnswerResult | null> {
  const { tx, actor, round, item, clarification, request } = context;
  const replay = await questions.inspectCommand(tx, item.id, {
    status: S.Answered,
    commandId: request.commandId,
    actorId: actor.membershipId,
    version: request.version,
    text: request.answer,
  });
  if (!replay.seen) return null;
  const isSameAnswer =
    replay.matches && clarification.answer_command_id === request.commandId;
  if (!isSameAnswer) return { ok: false, code: E.CommandIdReused };
  return {
    ok: true,
    value: await portalFeedbackService.loadItemDto(tx, actor, round, item),
  };
}

async function rejectUnlessAnswerable(
  context: AnswerContext,
): Promise<AnswerResult | null> {
  const { tx, actor, round, item, clarification, request } = context;
  const isRoundEditable = RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES.some(
    (status) => status === round.status,
  );
  if (!isRoundEditable) return { ok: false, code: E.Locked };
  if (item.version !== request.version)
    return versionConflict(
      item.version,
      await portalFeedbackService.loadItemDto(tx, actor, round, item),
    );
  if (clarification.status !== S.Open)
    return {
      ok: false,
      code: E.ClarificationNotOpen,
      current: await portalFeedbackService.loadItemDto(tx, actor, round, item),
    };
  return null;
}

async function saveAnswer(context: AnswerContext): Promise<AnswerResult> {
  const { tx, actor, round, projectTitle, item, clarification, request } =
    context;
  try {
    const next = await tx.transaction(async (savepoint) => {
      await questions.answer(savepoint, {
        clarification,
        answer: request.answer,
        portalMembershipId: actor.membershipId,
        commandId: request.commandId,
        requestVersion: request.version,
        now: new Date(),
      });
      const updated = await questions.writeItem(savepoint, item, false);
      await feedbackRoundWriteService.announceItemEvent(
        savepoint,
        round,
        projectTitle,
        SystemMessageKey.FeedbackClarificationAnswered,
        item.position,
      );
      return updated;
    });
    return {
      ok: true,
      value: await portalFeedbackService.loadItemDto(tx, actor, round, next),
    };
  } catch (error) {
    if (!(error instanceof FeedbackItemWriteConflictError)) throw error;
    const [current] = await itemQuery(tx, round.id, item.id);
    return current
      ? versionConflict(
          current.version,
          await portalFeedbackService.loadItemDto(tx, actor, round, current),
        )
      : portalFeedbackService.notFound();
  }
}
