import "server-only";

import { and, inArray, ne } from "drizzle-orm";

import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackDraftItemDto } from "@invessiv/common/contracts/portal/portal-feedback-draft-item.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { SavePortalFeedbackDraftRequestDto } from "@invessiv/common/contracts/portal/save-portal-feedback-draft-request.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRoundItems } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";

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

/** Item ids come from the client; one that already lives in another round must not be taken over. */
async function claimsForeignItem(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  items: readonly PortalFeedbackDraftItemDto[],
): Promise<boolean> {
  if (items.length === 0) return false;
  const [foreign] = await tx
    .select({ id: feedbackRoundItems.id })
    .from(feedbackRoundItems)
    .where(
      and(
        inArray(
          feedbackRoundItems.id,
          items.map((item) => item.id),
        ),
        ne(feedbackRoundItems.round_id, round.id),
      ),
    )
    .limit(1);
  return !!foreign;
}

/**
 * Replaces the whole draft of an open round. Parallel saves serialize on the round lock; the later
 * one sees the advanced version and gets 409 with the current draft. Saving writes no activity.
 */
export async function savePortalFeedbackDraft(
  actor: PortalActor,
  roundId: string,
  input: SavePortalFeedbackDraftRequestDto,
): Promise<PortalFeedbackResult<PortalFeedbackRoundDto>> {
  const parsed = portalFeedbackSchemas.draft.safeParse(input);
  if (!parsed.success) return VALIDATION;
  const { version, items } = parsed.data;

  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const locked = await portalFeedbackService.lockRound(tx, actor, roundId);
    if (!locked) return { ok: false, code: PortalFeedbackErrorCode.NotFound };
    const rejected = await portalFeedbackService.rejectUnlessOpen(
      tx,
      actor,
      locked.round,
      version,
    );
    if (rejected) return rejected;
    if (
      !usesKnownAreas(locked.round, items) ||
      (await claimsForeignItem(tx, locked.round, items))
    )
      return VALIDATION;

    const saved = await portalFeedbackService.writeRound(tx, locked.round, {
      draft_updated_at: new Date(),
      draft_updated_by_portal_membership_id: actor.membershipId,
    });
    await feedbackRoundItemService.replaceDraftItems(
      tx,
      saved,
      items,
      actor.membershipId,
    );
    return {
      ok: true,
      value: await portalFeedbackService.toRoundDto(tx, actor, saved),
    };
  });
}
