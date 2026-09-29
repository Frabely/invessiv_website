import "server-only";

import { and, eq } from "drizzle-orm";

import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";

type Result = PortalFeedbackResult<FeedbackAttachmentDto>;

const NOT_FOUND = {
  ok: false,
  code: PortalFeedbackErrorCode.NotFound,
} as const;

/** Unhooks a file from an item of an open round; the file itself stays under "your uploads". */
export async function detachPortalFeedbackFile(
  actor: PortalActor,
  target: { roundId: string; itemId: string; fileId: string },
): Promise<Result> {
  const itemId = portalFeedbackSchemas.id.safeParse(target.itemId);
  const fileId = portalFeedbackSchemas.id.safeParse(target.fileId);
  if (!itemId.success || !fileId.success) return NOT_FOUND;

  return getDrizzleDatabaseClient().transaction(async (tx): Promise<Result> => {
    const locked = await portalFeedbackService.lockRound(
      tx,
      actor,
      target.roundId,
    );
    if (!locked) return NOT_FOUND;
    const rejected = await portalFeedbackService.rejectUnlessOpen(
      tx,
      actor,
      locked.round,
    );
    if (rejected) return rejected;
    const [file] = await tx
      .select({ id: files.id, version: files.version })
      .from(files)
      .where(
        and(
          eq(files.id, fileId.data),
          eq(files.customer_id, actor.customerId),
          eq(files.feedback_round_id, locked.round.id),
          eq(files.feedback_item_id, itemId.data),
        ),
      )
      .limit(1)
      .for("update");
    if (!file) return NOT_FOUND;
    return {
      ok: true,
      value: await feedbackRoundItemService.detachFile(tx, file),
    };
  });
}
