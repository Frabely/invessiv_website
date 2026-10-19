import "server-only";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import { RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackRoundItemRow } from "@/server/shared/services/feedback/feedback-service-types";
import { feedbackClarificationService } from "@/server/shared/services/feedback/feedback-clarification-service";

import { and, asc, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FeedbackTransitionSide } from "@invessiv/common/constants/crm/feedback-transition-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import { canTransition } from "@invessiv/common/patterns/crm/feedback-round-state";
import {
  type ContactDatabaseReader,
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  feedbackRoundItems,
  feedbackRounds,
  projects,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";
import { portalFeedbackMappingService } from "./portal-feedback-mapping-service";
import { portalFeedbackSchemas } from "./portal-feedback-schemas";

type LockedRound = { round: FeedbackRoundRow; projectTitle: string };

function canRead(reader: PortalReader): boolean {
  return portalCanOn.forCustomer(reader, Permission.PortalFeedbackRead);
}

/** The owner view reads but never writes, whatever it holds. */
function canSubmit(reader: PortalReader): boolean {
  return (
    !isPortalOwnerView(reader) &&
    portalCanOn.forCustomer(reader, Permission.PortalFeedbackSubmit)
  );
}

/**
 * Attachments are shown through the portal's file visibility, which needs `portal.files.read`.
 * Without it a contact could hang files onto items and never see them again.
 */
function canAttach(reader: PortalReader): boolean {
  return (
    canSubmit(reader) &&
    portalCanOn.forCustomer(reader, Permission.PortalFilesRead)
  );
}

function notFound(): {
  ok: false;
  code: typeof PortalFeedbackErrorCode.NotFound;
} {
  return { ok: false, code: PortalFeedbackErrorCode.NotFound };
}

/**
 * Locks a round the actor may change, together with its project title for the chat notice. Every
 * miss — guessed id, foreign company, hidden project, missing permission — is the same `null`.
 */
async function lockRound(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  roundId: string,
): Promise<LockedRound | null> {
  const id = portalFeedbackSchemas.id.safeParse(roundId);
  if (!canSubmit(actor) || !id.success) return null;
  const [row] = await tx
    .select({ round: feedbackRounds, projectTitle: projects.title })
    .from(feedbackRounds)
    .innerJoin(projects, eq(projects.id, feedbackRounds.project_id))
    .where(
      and(
        eq(feedbackRounds.id, id.data),
        eq(feedbackRounds.customer_id, actor.customerId),
        portalProjectCondition(actor, Permission.PortalFeedbackSubmit),
      ),
    )
    .limit(1)
    .for("update", { of: feedbackRounds });
  return row ?? null;
}

/**
 * The frame of every portal feedback command: one transaction, the round locked first, a miss as
 * `not_found`. Parallel saves, submissions and attachments of one round serialize on this lock.
 */
function withLockedRound<T, TConflict = PortalFeedbackRoundDto>(
  actor: PortalActor,
  roundId: string,
  run: (
    tx: ContactDatabaseTransaction,
    locked: LockedRound,
  ) => Promise<PortalFeedbackResult<T, TConflict>>,
): Promise<PortalFeedbackResult<T, TConflict>> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const locked = await lockRound(tx, actor, roundId);
    if (!locked) return notFound();
    return run(tx, locked);
  });
}

/** Rounds with their items; attachments follow the portal's own file visibility. */
async function loadRoundDtos(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  rounds: readonly FeedbackRoundRow[],
): Promise<PortalFeedbackRoundDto[]> {
  const [items, contactNames] = await Promise.all([
    feedbackRoundItemService.loadByRound(
      executor,
      rounds.map((round) => round.id),
      portalFileService.visibleCondition(reader),
    ),
    loadPortalContactNames(
      executor,
      rounds.map((round) => round.draft_updated_by_portal_membership_id),
    ),
  ]);
  const clarifications = await feedbackClarificationService.loadByItems(
    executor,
    [...items.values()].flatMap((entries) =>
      entries.map(({ item }) => item.id),
    ),
  );
  return rounds.map((round) =>
    portalFeedbackMappingService.toRoundDto(
      round,
      items.get(round.id) ?? [],
      contactNames,
      clarifications,
    ),
  );
}

async function loadRoundDto(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  round: FeedbackRoundRow,
): Promise<PortalFeedbackRoundDto> {
  const [dto] = await loadRoundDtos(executor, reader, [round]);
  return dto;
}

/**
 * The customer may only take steps `FEEDBACK_ROUND_TRANSITIONS` allows from the current status;
 * everything else is `locked`. A draft counts as editable while it could still be submitted.
 * `expectedVersion` is compared under the round lock, so a stale client gets the whole current round.
 */
async function rejectUnlessAllowed(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
  target: FeedbackRoundStatus,
  expectedVersion?: number,
): Promise<PortalFeedbackResult<never> | null> {
  if (!canTransition(round.status, target, FeedbackTransitionSide.Customer))
    return { ok: false, code: PortalFeedbackErrorCode.Locked };
  if (expectedVersion === undefined || round.version === expectedVersion)
    return null;
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: round.version,
      current: await loadRoundDto(tx, actor, round),
    },
  };
}

/** Whether the item belongs to this round; attaching needs nothing else from it. */
async function hasItem(
  tx: ContactDatabaseReader,
  roundId: string,
  itemId: string,
): Promise<boolean> {
  const [item] = await tx
    .select({ id: feedbackRoundItems.id })
    .from(feedbackRoundItems)
    .where(
      and(
        eq(feedbackRoundItems.id, itemId),
        eq(feedbackRoundItems.round_id, roundId),
      ),
    )
    .limit(1);
  return !!item;
}

/** Id and text of every item in display order; the submit and approve checks need them. */
function listItemHeads(
  tx: ContactDatabaseReader,
  roundId: string,
): Promise<{ id: string; body: string }[]> {
  return tx
    .select({ id: feedbackRoundItems.id, body: feedbackRoundItems.body })
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, roundId))
    .orderBy(asc(feedbackRoundItems.position));
}

/** Loads visible attachments and clarifications before delegating to the pure item mapper. */
async function loadItemDto(
  reader: ContactDatabaseReader,
  actor: PortalReader,
  round: FeedbackRoundRow,
  item: FeedbackRoundItemRow,
): Promise<PortalFeedbackItemDto> {
  const [items, questions] = await Promise.all([
    feedbackRoundItemService.loadByRound(
      reader,
      [round.id],
      portalFileService.visibleCondition(actor),
    ),
    feedbackClarificationService.loadByItems(reader, [item.id]),
  ]);
  const attachments =
    items.get(round.id)?.find((entry) => entry.item.id === item.id)
      ?.attachments ?? [];
  return portalFeedbackMappingService.toItemDto(
    { item, attachments },
    (RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES as readonly string[]).includes(
      round.status,
    ),
    questions.get(item.id) ?? [],
  );
}

export const portalFeedbackService = {
  loadItemDto,
  canRead,
  canSubmit,
  canAttach,
  notFound,
  withLockedRound,
  rejectUnlessAllowed,
  listItemHeads,
  hasItem,
  loadRoundDtos,
  loadRoundDto,
} as const;
