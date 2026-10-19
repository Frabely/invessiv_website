import "server-only";

import { and, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  feedbackRoundItems,
  feedbackRounds,
  projects,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { feedbackClarificationService } from "@/server/shared/services/feedback/feedback-clarification-service";
import { feedbackResultHistoryService } from "@/server/shared/services/feedback/feedback-result-history-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import type { FeedbackRoundItemRow } from "@/server/shared/services/feedback/feedback-service-types";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { fileAccessService } from "../files/file-access-service";
import { feedbackRoundMappingService } from "./feedback-round-mapping-service";

/** Every internal item action locks the authorized round before freshly reading its item. */
async function lock(
  tx: ContactDatabaseTransaction,
  itemId: string,
  actor: WorkspaceActor,
) {
  const [target] = await tx
    .select({ round: feedbackRounds, projectTitle: projects.title })
    .from(feedbackRoundItems)
    .innerJoin(
      feedbackRounds,
      eq(feedbackRounds.id, feedbackRoundItems.round_id),
    )
    .innerJoin(projects, eq(projects.id, feedbackRounds.project_id))
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
    return null;
  const item = await readLocked(tx, itemId);
  return item ? { ...target, item } : null;
}

async function readLocked(
  tx: ContactDatabaseTransaction,
  itemId: string,
): Promise<FeedbackRoundItemRow | null> {
  const [item] = await tx
    .select()
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.id, itemId))
    .for("update");
  return item ?? null;
}

/** Loads related data for the pure item mapper; file visibility follows the actor's scope. */
async function loadItemDto(
  reader: ContactDatabaseReader,
  item: FeedbackRoundItemRow,
  actor: WorkspaceActor,
): Promise<FeedbackRoundItemDto> {
  const [items, history, questions] = await Promise.all([
    feedbackRoundItemService.loadByRound(
      reader,
      [item.round_id],
      fileAccessService.readableCondition(actor),
    ),
    feedbackResultHistoryService.loadByItems(reader, [item.id]),
    feedbackClarificationService.loadInternalByItems(reader, [item.id]),
  ]);
  const attachments =
    items.get(item.round_id)?.find((loaded) => loaded.item.id === item.id)
      ?.attachments ?? [];
  return feedbackRoundMappingService.toItemDto(
    { item, attachments },
    history.get(item.id) ?? [],
    questions.get(item.id) ?? [],
  );
}

export const feedbackItemProcessingService = {
  lock,
  readLocked,
  loadItemDto,
} as const;
