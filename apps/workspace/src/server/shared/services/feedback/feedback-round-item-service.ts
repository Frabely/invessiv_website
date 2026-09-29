import "server-only";

import { and, asc, eq, inArray, ne, type SQL, sql } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { FeedbackRoundItemsConstraintName } from "@invessiv/db/constraint-names/crm/feedback-round-items-constraint-names";
import { feedbackRoundItems, files } from "@invessiv/db/record-configuration";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { feedbackAttachmentService } from "./feedback-attachment-service";
import { FeedbackItemIdTakenError } from "./feedback-item-id-taken-error.class";
import { feedbackMappingService } from "./feedback-mapping-service";
import type {
  FeedbackDraftItemInput,
  FeedbackReadExecutor,
  FeedbackRoundItemRow,
  FeedbackRoundRef,
  LoadedFeedbackItem,
} from "./feedback-service-types";

const positionConstraint = sql.identifier(
  FeedbackRoundItemsConstraintName.RoundPositionUnique,
);

/**
 * Items and attachments of several rounds in one query. `visibility` is the caller's file filter
 * (portal release or internal scope); an attachment outside it is left out entirely.
 */
async function loadByRound(
  tx: FeedbackReadExecutor,
  roundIds: readonly string[],
  visibility: SQL,
): Promise<Map<string, LoadedFeedbackItem[]>> {
  const byRound = new Map<string, LoadedFeedbackItem[]>();
  if (roundIds.length === 0) return byRound;
  const rows = await tx
    .select({
      item: feedbackRoundItems,
      fileId: files.id,
      displayName: files.display_name,
      assetKind: files.asset_kind,
      sizeBytes: files.size_bytes,
    })
    .from(feedbackRoundItems)
    .leftJoin(
      files,
      and(eq(files.feedback_item_id, feedbackRoundItems.id), visibility),
    )
    .where(inArray(feedbackRoundItems.round_id, [...roundIds]))
    .orderBy(
      asc(feedbackRoundItems.round_id),
      asc(feedbackRoundItems.position),
      asc(files.created_at),
      asc(files.id),
    );
  const byItem = new Map<string, LoadedFeedbackItem>();
  for (const row of rows) {
    let loaded = byItem.get(row.item.id);
    if (!loaded) {
      loaded = { item: row.item, attachments: [] };
      byItem.set(row.item.id, loaded);
      const list = byRound.get(row.item.round_id) ?? [];
      list.push(loaded);
      byRound.set(row.item.round_id, list);
    }
    if (row.fileId && row.displayName && row.assetKind)
      loaded.attachments.push(
        feedbackMappingService.toAttachmentDto({
          fileId: row.fileId,
          displayName: row.displayName,
          assetKind: row.assetKind,
          sizeBytes: row.sizeBytes,
        }),
      );
  }
  return byRound;
}

async function rejectForeignIds(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  items: readonly FeedbackDraftItemInput[],
): Promise<void> {
  if (items.length === 0) return;
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
  if (foreign) throw new FeedbackItemIdTakenError();
}

/** Deletes items missing from the draft after unbinding their files, which stay with the customer. */
async function removeMissingItems(
  tx: ContactDatabaseTransaction,
  stored: readonly FeedbackRoundItemRow[],
  items: readonly FeedbackDraftItemInput[],
): Promise<void> {
  const keptIds = new Set(items.map((item) => item.id));
  const removedIds = stored
    .filter((item) => !keptIds.has(item.id))
    .map((item) => item.id);
  if (removedIds.length === 0) return;
  await feedbackAttachmentService.detachItemFiles(tx, removedIds);
  await tx
    .delete(feedbackRoundItems)
    .where(inArray(feedbackRoundItems.id, removedIds));
}

/** A parallel save of another round may claim the same client id after the check; the PK decides. */
async function insertItem(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  item: FeedbackDraftItemInput,
  position: number,
  portalMembershipId: string,
): Promise<void> {
  const inserted = await tx
    .insert(feedbackRoundItems)
    .values({
      id: item.id,
      round_id: round.id,
      position,
      area_label: item.areaLabel,
      kind: item.kind,
      body: item.body,
      created_by_portal_membership_id: portalMembershipId,
      result: null,
      result_note: null,
      result_set_by_member_id: null,
      result_set_at: null,
      version: 1,
    })
    .onConflictDoNothing({ target: feedbackRoundItems.id })
    .returning({ id: feedbackRoundItems.id });
  if (inserted.length === 0) throw new FeedbackItemIdTakenError();
}

async function updateItem(
  tx: ContactDatabaseTransaction,
  stored: FeedbackRoundItemRow,
  item: FeedbackDraftItemInput,
  position: number,
): Promise<void> {
  if (
    stored.position === position &&
    stored.area_label === item.areaLabel &&
    stored.kind === item.kind &&
    stored.body === item.body
  )
    return;
  await updateLockedVersioned(
    {
      tx,
      table: feedbackRoundItems,
      id: stored.id,
      expectedVersion: stored.version,
      patch: {
        position,
        area_label: item.areaLabel,
        kind: item.kind,
        body: item.body,
      },
    },
    "Locked feedback item changed",
  );
}

/**
 * Brings the stored draft in line with `items`: the list order becomes the position, unknown ids are
 * inserted, missing ones deleted. The handler has validated areas and limits and holds the round
 * lock. Swapping two positions would trip the unique index row by row, so it is checked once at the
 * end instead. An id of another round throws `FeedbackItemIdTakenError`; the caller runs this in a
 * savepoint and answers with a validation error.
 */
async function replaceDraftItems(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  items: readonly FeedbackDraftItemInput[],
  portalMembershipId: string,
): Promise<void> {
  await rejectForeignIds(tx, round, items);
  const stored = await tx
    .select()
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, round.id))
    .for("update");
  await removeMissingItems(tx, stored, items);

  const storedById = new Map(stored.map((item) => [item.id, item]));
  await tx.execute(sql`set constraints ${positionConstraint} deferred`);
  for (const [position, item] of items.entries()) {
    const existing = storedById.get(item.id);
    if (existing) await updateItem(tx, existing, item, position);
    else await insertItem(tx, round, item, position, portalMembershipId);
  }
  await tx.execute(sql`set constraints ${positionConstraint} immediate`);
}

export const feedbackRoundItemService = {
  loadByRound,
  replaceDraftItems,
} as const;
