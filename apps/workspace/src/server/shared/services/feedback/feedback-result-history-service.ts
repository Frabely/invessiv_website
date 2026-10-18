import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackResultActorSide as A } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind as K } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import type { FeedbackItemResultHistoryEntryDto } from "@invessiv/common/contracts/crm/feedback-item-result-history-entry.dto";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  feedbackRoundItemResultHistory as history,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import { FeedbackResultBaselineMissingError } from "./feedback-result-baseline-missing-error.class";
import { feedbackResultHistoryMappingService } from "./feedback-result-history-mapping-service";
import type {
  FeedbackResultHistoryActor,
  FeedbackResultHistoryRow,
  FeedbackRoundItemRow,
} from "./feedback-service-types";

function snapshot(item: FeedbackRoundItemRow) {
  return {
    item_id: item.id,
    item_version: item.version,
    result: item.result,
    result_note: item.result_note,
    result_set_by_member_id: item.result_set_by_member_id,
    result_set_at: item.result_set_at,
  };
}

/** Caller holds the item lock; both snapshots belong to the same transaction as the item write. */
async function recordChange(
  tx: ContactDatabaseTransaction,
  {
    stored,
    next,
    actor,
    command,
  }: {
    stored: FeedbackRoundItemRow;
    next: FeedbackRoundItemRow;
    actor: FeedbackResultHistoryActor;
    command: { commandId: string; requestVersion: number } | null;
  },
): Promise<void> {
  if (stored.result === next.result && stored.result_note === next.result_note)
    return;
  if (stored.result !== null) {
    const [existing] = await tx
      .select({ id: history.id })
      .from(history)
      .where(eq(history.item_id, stored.id))
      .limit(1);
    if (!existing) {
      if (!stored.result_set_at || !stored.result_set_by_member_id)
        throw new FeedbackResultBaselineMissingError();
      await tx.insert(history).values({
        ...snapshot(stored),
        id: randomUUID(),
        event_kind: K.Baseline,
        actor_side: A.Member,
        actor_member_id: stored.result_set_by_member_id,
        actor_portal_membership_id: null,
        occurred_at: stored.result_set_at,
        command_id: null,
        request_version: null,
      });
    }
  }
  await tx.insert(history).values({
    ...snapshot(next),
    id: randomUUID(),
    event_kind: next.result === null ? K.Reset : K.Set,
    actor_side: actor.side,
    actor_member_id: actor.side === A.Member ? actor.memberId : null,
    actor_portal_membership_id:
      actor.side === A.PortalContact ? actor.portalMembershipId : null,
    occurred_at: next.result_set_at ?? next.updated_at,
    command_id: command?.commandId ?? null,
    request_version: command?.requestVersion ?? null,
  });
}

async function findByCommand(
  tx: ContactDatabaseReader,
  itemId: string,
  commandId: string,
): Promise<FeedbackResultHistoryRow | null> {
  const [entry] = await tx
    .select()
    .from(history)
    .where(and(eq(history.item_id, itemId), eq(history.command_id, commandId)))
    .limit(1);
  return entry ?? null;
}

/** A replay must repeat the recorded action exactly; anything else reuses the id for a different action. */
function matchesCommand(
  entry: FeedbackResultHistoryRow,
  request: {
    memberId: string;
    version: number;
    result: FeedbackItemResult | null;
    resultNote: string | null;
  },
): boolean {
  return (
    entry.event_kind === (request.result === null ? K.Reset : K.Set) &&
    entry.actor_member_id === request.memberId &&
    entry.request_version === request.version &&
    entry.result === request.result &&
    entry.result_note === request.resultNote
  );
}

/** Only internal readers call this; portal responses never load result history. */
async function loadByItems(
  reader: ContactDatabaseReader,
  itemIds: readonly string[],
): Promise<Map<string, FeedbackItemResultHistoryEntryDto[]>> {
  const byItem = new Map<string, FeedbackItemResultHistoryEntryDto[]>();
  if (itemIds.length === 0) return byItem;
  const rows = await reader
    .select({ entry: history, memberName: users.display_name })
    .from(history)
    .leftJoin(
      workspaceMembers,
      eq(workspaceMembers.id, history.actor_member_id),
    )
    .leftJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(inArray(history.item_id, [...itemIds]))
    .orderBy(asc(history.item_id), asc(history.item_version));
  const contactNames = await loadPortalContactNames(
    reader,
    rows.map(({ entry }) => entry.actor_portal_membership_id),
  );
  for (const { entry, memberName } of rows) {
    const entries = byItem.get(entry.item_id) ?? [];
    entries.push(
      feedbackResultHistoryMappingService.toEntryDto(
        entry,
        memberName,
        contactNames,
      ),
    );
    byItem.set(entry.item_id, entries);
  }
  return byItem;
}

export const feedbackResultHistoryService = {
  recordChange,
  findByCommand,
  matchesCommand,
  loadByItems,
} as const;
