import "server-only";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackDraftItemDto } from "@invessiv/common/contracts/portal/portal-feedback-draft-item.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { SavePortalFeedbackDraftRequestDto } from "@invessiv/common/contracts/portal/save-portal-feedback-draft-request.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { FeedbackItemIdTakenError } from "@/server/shared/services/feedback/feedback-item-id-taken-error.class";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

type Result = PortalFeedbackResult<PortalFeedbackRoundDto>;

const VALIDATION = {
  ok: false,
  code: PortalFeedbackErrorCode.Validation,
} as const;

/** "General" is `null`; any other area must come from the round's snapshot. */
function usesKnownAreas(
  round: FeedbackRoundRow,
  items: readonly PortalFeedbackDraftItemDto[],
): boolean {
  const areas = new Set(round.area_options);
  return items.every(
    (item) => item.areaLabel === null || areas.has(item.areaLabel),
  );
}

/** A client id of another round rolls back only this savepoint and answers as a validation error. */
async function writeDraft(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
  items: readonly PortalFeedbackDraftItemDto[],
): Promise<Result> {
  try {
    const saved = await tx.transaction((savepoint) =>
      feedbackRoundWriteService.saveDraft(
        savepoint,
        round,
        items,
        actor.membershipId,
      ),
    );
    return {
      ok: true,
      value: await portalFeedbackService.toRoundDto(tx, actor, saved),
    };
  } catch (error) {
    if (error instanceof FeedbackItemIdTakenError) return VALIDATION;
    throw error;
  }
}

/**
 * Replaces the whole draft of an open round. Parallel saves serialize on the round lock; the later
 * one sees the advanced version and gets 409 with the current draft. Saving writes no activity.
 */
export async function savePortalFeedbackDraft(
  actor: PortalActor,
  roundId: string,
  input: SavePortalFeedbackDraftRequestDto,
): Promise<Result> {
  const parsed = portalFeedbackSchemas.draft.safeParse(input);
  if (!parsed.success) return VALIDATION;
  const { version, items } = parsed.data;

  return portalFeedbackService.withLockedRound(
    actor,
    roundId,
    async (tx, { round }) => {
      const rejected = await portalFeedbackService.rejectUnlessAllowed(
        tx,
        actor,
        round,
        FeedbackRoundStatus.Submitted,
        version,
      );
      if (rejected) return rejected;
      if (!usesKnownAreas(round, items)) return VALIDATION;
      return writeDraft(tx, actor, round, items);
    },
  );
}
