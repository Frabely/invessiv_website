import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FeedbackTransitionSide } from "@invessiv/common/constants/crm/feedback-transition-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ChangeFeedbackRoundStatusRequestDto } from "@invessiv/common/contracts/crm/change-feedback-round-status-request.dto";
import type { ChangeFeedbackRoundStatusResult } from "@invessiv/common/contracts/crm/results/change-feedback-round-status-result";
import { canTransition } from "@invessiv/common/patterns/crm/feedback-round-state";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  feedbackRoundItems,
  feedbackRounds,
  projects,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type {
  FeedbackMemberWrite,
  FeedbackRoundRow,
} from "@/server/shared/services/feedback/feedback-service-types";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { feedbackRoundService } from "@/server/workspace/crm/services/feedback/feedback-round-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

type ChangeStatusInput = z.output<typeof feedbackRoundSchemas.changeStatus>;

const ROUND_NOT_FOUND = {
  ok: false,
  code: FeedbackRoundErrorCode.RoundNotFound,
} as const;

/**
 * Locks a round the member may write, with the project title for the chat notice. Result writes
 * hold the round `FOR SHARE`, so the completion check cannot miss an item result set in parallel.
 */
async function lockRound(
  tx: ContactDatabaseTransaction,
  roundId: string,
  actor: WorkspaceActor,
): Promise<{ round: FeedbackRoundRow; projectTitle: string } | null> {
  const [row] = await tx
    .select({ round: feedbackRounds, projectTitle: projects.title })
    .from(feedbackRounds)
    .innerJoin(projects, eq(projects.id, feedbackRounds.project_id))
    .where(
      and(
        eq(feedbackRounds.id, roundId),
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
    .for("update", { of: feedbackRounds });
  if (
    !row ||
    !canOn(actor, Permission.ProjectsWrite, {
      customerId: row.round.customer_id,
      projectId: row.round.project_id,
    })
  )
    return null;
  return row;
}

async function hasItemWithoutResult(
  tx: ContactDatabaseTransaction,
  roundId: string,
): Promise<boolean> {
  const [open] = await tx
    .select({ id: feedbackRoundItems.id })
    .from(feedbackRoundItems)
    .where(
      and(
        eq(feedbackRoundItems.round_id, roundId),
        isNull(feedbackRoundItems.result),
      ),
    )
    .limit(1);
  return !!open;
}

function takeStep(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  input: ChangeStatusInput,
  context: FeedbackMemberWrite,
): Promise<FeedbackRoundRow> {
  switch (input.to) {
    case FeedbackRoundStatus.InDiscussion:
      return feedbackRoundWriteService.requestDiscussion(tx, round, {
        ...context,
        customerNotice: input.customerNotice,
      });
    case FeedbackRoundStatus.InProgress:
      return feedbackRoundWriteService.startImplementation(tx, round, context);
    case FeedbackRoundStatus.Open:
      return feedbackRoundWriteService.returnToCustomer(tx, round, {
        ...context,
        customerNotice: input.customerNotice,
      });
    case FeedbackRoundStatus.Completed:
      return feedbackRoundWriteService.complete(tx, round, context);
  }
}

/**
 * The team's steps on a running round: ask for a call, start the work, hand the round back or
 * complete it. Only steps of `FEEDBACK_ROUND_TRANSITIONS` pass; the version is compared under the
 * round lock, so a stale tab gets the current round with its 409. The project phase stays untouched;
 * completion advances the process step unless another round follows directly.
 */
export async function changeFeedbackRoundStatus(
  roundId: string,
  input: ChangeFeedbackRoundStatusRequestDto,
  actor: WorkspaceActor,
): Promise<ChangeFeedbackRoundStatusResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(roundId).success)
    return ROUND_NOT_FOUND;
  const parsed = feedbackRoundSchemas.changeStatus.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: FeedbackRoundErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  return getDrizzleDatabaseClient().transaction(
    async (tx): Promise<ChangeFeedbackRoundStatusResult> => {
      const locked = await lockRound(tx, roundId, actor);
      if (!locked) return ROUND_NOT_FOUND;
      const { round, projectTitle } = locked;
      if (round.version !== parsed.data.version)
        return {
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: round.version,
            current: await feedbackRoundService.toRoundDto(tx, round, actor),
          },
        };
      if (
        !canTransition(
          round.status,
          parsed.data.to,
          FeedbackTransitionSide.Internal,
        )
      )
        return { ok: false, code: FeedbackRoundErrorCode.InvalidTransition };
      if (
        parsed.data.to === FeedbackRoundStatus.Completed &&
        (await hasItemWithoutResult(tx, round.id))
      )
        return { ok: false, code: FeedbackRoundErrorCode.ResultsIncomplete };

      const changed = await takeStep(tx, round, parsed.data, {
        actor,
        projectTitle,
      });
      return {
        ok: true,
        round: await feedbackRoundService.toRoundDto(tx, changed, actor),
      };
    },
  );
}
