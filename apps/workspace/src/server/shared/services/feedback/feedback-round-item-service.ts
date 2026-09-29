import "server-only";

import { and, asc, eq, inArray, type SQL, sql } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { FeedbackRoundItemsConstraintName } from "@invessiv/db/constraint-names/crm/feedback-round-items-constraint-names";
import { feedbackRoundItems, files } from "@invessiv/db/record-configuration";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { feedbackMappingService } from "./feedback-mapping-service";
import type {
  FeedbackDraftItemInput,
  FeedbackReadExecutor,
  FeedbackRoundItemRow,
  FeedbackRoundRef,
  LoadedFeedbackItem,
  LockedFeedbackFile,
} from "./feedback-service-types";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";

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

/** The caller holds the file lock, so a lost version race is a bug, not a user conflict. */
async function writeFileBinding(
  tx: ContactDatabaseTransaction,
  file: LockedFeedbackFile,
  patch: Pick<
    typeof files.$inferInsert,
    "feedback_round_id" | "feedback_item_id" | "project_id"
  >,
) {
  const write = await updateVersioned({
    tx,
    table: files,
    id: file.id,
    expectedVersion: file.version,
    patch,
    toDto: (row) => row,
  });
  if (!write.ok) throw new Error("Locked feedback file changed");
  return write.value;
}

/** A file without project joins the round's project; the item binding requires one. */
async function attachFile(
  tx: ContactDatabaseTransaction,
  file: LockedFeedbackFile,
  target: { round: FeedbackRoundRef; itemId: string },
): Promise<FeedbackAttachmentDto> {
  const row = await writeFileBinding(tx, file, {
    feedback_round_id: target.round.id,
    feedback_item_id: target.itemId,
    project_id: target.round.project_id,
  });
  return feedbackMappingService.fileToAttachmentDto(row);
}

/** The file stays with the customer under "your uploads"; only its feedback binding goes. */
async function detachFile(
  tx: ContactDatabaseTransaction,
  file: LockedFeedbackFile,
): Promise<FeedbackAttachmentDto> {
  const row = await writeFileBinding(tx, file, {
    feedback_round_id: null,
    feedback_item_id: null,
  });
  return feedbackMappingService.fileToAttachmentDto(row);
}

async function detachFiles(
  tx: ContactDatabaseTransaction,
  itemIds: readonly string[],
): Promise<void> {
  const bound = await tx
    .select({ id: files.id, version: files.version })
    .from(files)
    .where(inArray(files.feedback_item_id, [...itemIds]))
    .for("update");
  for (const file of bound) await detachFile(tx, file);
}

/** Attachments already on the item and on the whole round; the round lock keeps both stable. */
async function countAttachments(
  tx: FeedbackReadExecutor,
  target: { roundId: string; itemId: string },
): Promise<{ onItem: number; onRound: number }> {
  const [counts] = await tx
    .select({
      onItem:
        sql<number>`count(*) filter (where ${files.feedback_item_id} = ${target.itemId})`.mapWith(
          Number,
        ),
      onRound: sql<number>`count(*)`.mapWith(Number),
    })
    .from(files)
    .where(eq(files.feedback_round_id, target.roundId));
  return counts ?? { onItem: 0, onRound: 0 };
}

function hasChanged(
  stored: FeedbackRoundItemRow,
  next: FeedbackDraftItemInput,
  position: number,
): boolean {
  return (
    stored.position !== position ||
    stored.area_label !== next.areaLabel ||
    stored.kind !== next.kind ||
    stored.body !== next.body
  );
}

/**
 * Brings the stored draft in line with `items`: the list order becomes the position, unknown ids are
 * inserted, missing ones deleted. The handler has validated ids, areas and limits and holds the round
 * lock. Swapping two positions would trip the unique index row by row, so it is checked once at the
 * end instead.
 */
async function replaceDraftItems(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  items: readonly FeedbackDraftItemInput[],
  portalMembershipId: string,
): Promise<void> {
  const stored = await tx
    .select()
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, round.id))
    .for("update");
  const storedById = new Map(stored.map((item) => [item.id, item]));
  const keptIds = new Set(items.map((item) => item.id));
  const removedIds = stored
    .filter((item) => !keptIds.has(item.id))
    .map((item) => item.id);

  if (removedIds.length > 0) {
    await detachFiles(tx, removedIds);
    await tx
      .delete(feedbackRoundItems)
      .where(inArray(feedbackRoundItems.id, removedIds));
  }

  await tx.execute(sql`set constraints ${positionConstraint} deferred`);
  for (const [position, item] of items.entries()) {
    const existing = storedById.get(item.id);
    if (!existing) {
      await tx.insert(feedbackRoundItems).values({
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
      });
      continue;
    }
    if (!hasChanged(existing, item, position)) continue;
    const write = await updateVersioned({
      tx,
      table: feedbackRoundItems,
      id: item.id,
      expectedVersion: existing.version,
      patch: {
        position,
        area_label: item.areaLabel,
        kind: item.kind,
        body: item.body,
      },
      toDto: (row) => row.id,
    });
    if (!write.ok) throw new Error("Locked feedback item changed");
  }
  await tx.execute(sql`set constraints ${positionConstraint} immediate`);
}

export const feedbackRoundItemService = {
  loadByRound,
  replaceDraftItems,
  attachFile,
  detachFile,
  countAttachments,
} as const;
