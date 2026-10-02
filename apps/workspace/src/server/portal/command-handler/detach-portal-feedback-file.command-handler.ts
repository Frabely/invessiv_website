import "server-only";

import { and, eq } from "drizzle-orm";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { feedbackAttachmentService } from "@/server/shared/services/feedback/feedback-attachment-service";

type Result = PortalFeedbackResult<FileAttachmentDto>;

/** Only a file bound to exactly this item of this round; anything else looks absent. */
async function lockBoundFile(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  target: { roundId: string; itemId: string; fileId: string },
) {
  const [file] = await tx
    .select({ id: files.id, version: files.version })
    .from(files)
    .where(
      and(
        eq(files.id, target.fileId),
        eq(files.customer_id, actor.customerId),
        eq(files.feedback_round_id, target.roundId),
        eq(files.feedback_item_id, target.itemId),
      ),
    )
    .limit(1)
    .for("update");
  return file ?? null;
}

/** Unhooks a file from an item of an editable round; the file itself stays under "your uploads". */
export async function detachPortalFeedbackFile(
  actor: PortalActor,
  target: { roundId: string; itemId: string; fileId: string },
): Promise<Result> {
  const itemId = portalFeedbackSchemas.id.safeParse(target.itemId);
  const fileId = portalFeedbackSchemas.id.safeParse(target.fileId);
  if (
    !itemId.success ||
    !fileId.success ||
    !portalFeedbackService.canAttach(actor)
  )
    return portalFeedbackService.notFound();

  return portalFeedbackService.withLockedRound(
    actor,
    target.roundId,
    async (tx, { round }) => {
      const rejected = await portalFeedbackService.rejectUnlessAllowed(
        tx,
        actor,
        round,
        FeedbackRoundStatus.Submitted,
      );
      if (rejected) return rejected;
      const file = await lockBoundFile(tx, actor, {
        roundId: round.id,
        itemId: itemId.data,
        fileId: fileId.data,
      });
      if (!file) return portalFeedbackService.notFound();
      return {
        ok: true,
        value: await feedbackAttachmentService.detachFile(tx, file),
      };
    },
  );
}
