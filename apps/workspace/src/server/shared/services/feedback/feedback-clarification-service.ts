import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import type { FeedbackItemInternalClarificationDto } from "@invessiv/common/contracts/crm/feedback-item-internal-clarification.dto";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  feedbackRoundItemClarifications as questions,
  feedbackRoundItems,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import {
  updateLockedVersioned,
  updateVersioned,
} from "@/server/workspace/shared/update-versioned";
import { FeedbackItemWriteConflictError } from "./feedback-item-write-conflict-error.class";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import { feedbackClarificationMappingService } from "./feedback-clarification-mapping-service";
import type {
  FeedbackClarificationRow,
  FeedbackRoundItemRow,
} from "./feedback-service-types";
import { FeedbackResultHistoryEventKind } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import { feedbackResultHistoryService } from "./feedback-result-history-service";

type ClarificationCommand = {
  status: FeedbackClarificationStatus;
  commandId: string;
  actorId: string;
  version: number;
  text: string;
};

/** Inspect identifiers across actions before checking current versions or states. */
async function inspectCommand(
  tx: ContactDatabaseReader,
  itemId: string,
  request: ClarificationCommand,
): Promise<{ seen: boolean; matches: boolean }> {
  const entry = await findByCommand(tx, itemId, request.commandId);
  const history = await feedbackResultHistoryService.findByCommand(
    tx,
    itemId,
    request.commandId,
  );
  const isCorrelatedResultReset =
    request.status === FeedbackClarificationStatus.Open &&
    entry?.id === request.commandId &&
    history?.event_kind === FeedbackResultHistoryEventKind.Reset;
  const isCommandUsedByAnotherAction =
    history !== null && !isCorrelatedResultReset;
  if (isCommandUsedByAnotherAction) return { seen: true, matches: false };
  if (!entry) return { seen: false, matches: false };
  return { seen: true, matches: matchesCommand(entry, request) };
}

function matchesCommand(
  entry: FeedbackClarificationRow,
  request: ClarificationCommand,
): boolean {
  switch (request.status) {
    case FeedbackClarificationStatus.Open:
      return (
        entry.id === request.commandId &&
        entry.requested_by_member_id === request.actorId &&
        entry.request_version === request.version &&
        entry.question === request.text
      );
    case FeedbackClarificationStatus.Answered:
      return (
        entry.answer_command_id === request.commandId &&
        entry.answered_by_portal_membership_id === request.actorId &&
        entry.answer_request_version === request.version &&
        entry.answer === request.text
      );
    case FeedbackClarificationStatus.Closed:
      return (
        entry.close_command_id === request.commandId &&
        entry.closed_by_member_id === request.actorId &&
        entry.close_request_version === request.version &&
        entry.close_note === request.text
      );
  }
}

/** One item update per action, including any correlated result reset. Caller owns the savepoint. */
async function writeItem(
  tx: ContactDatabaseTransaction,
  item: FeedbackRoundItemRow,
  resetResult: boolean,
): Promise<FeedbackRoundItemRow> {
  const write = await updateVersioned({
    tx,
    table: feedbackRoundItems,
    id: item.id,
    expectedVersion: item.version,
    patch: resetResult
      ? {
          result: null,
          result_note: null,
          result_set_by_member_id: null,
          result_set_at: null,
        }
      : {},
    toDto: (row) => row,
  });
  if (!write.ok) throw new FeedbackItemWriteConflictError();
  return write.value;
}

async function loadByItems(
  reader: ContactDatabaseReader,
  itemIds: readonly string[],
): Promise<Map<string, FeedbackClarificationRow[]>> {
  const grouped = new Map<string, FeedbackClarificationRow[]>();
  if (!itemIds.length) return grouped;
  const rows = await reader
    .select()
    .from(questions)
    .where(inArray(questions.item_id, [...itemIds]))
    .orderBy(
      asc(questions.item_id),
      asc(questions.requested_at),
      asc(questions.id),
    );
  for (const row of rows) {
    const entries = grouped.get(row.item_id) ?? [];
    entries.push(row);
    grouped.set(row.item_id, entries);
  }
  return grouped;
}

/** Resolve authors in batches only for internal readers. Public mappers whitelist public fields. */
async function loadInternalByItems(
  reader: ContactDatabaseReader,
  itemIds: readonly string[],
): Promise<Map<string, FeedbackItemInternalClarificationDto[]>> {
  const grouped = await loadByItems(reader, itemIds);
  const rows = [...grouped.values()].flat();
  if (!rows.length) return new Map();
  const memberIds = [
    ...new Set(
      rows.flatMap((row) =>
        [row.requested_by_member_id, row.closed_by_member_id].filter(
          (id): id is string => id !== null,
        ),
      ),
    ),
  ];
  const [members, contacts] = await Promise.all([
    reader
      .select({ id: workspaceMembers.id, name: users.display_name })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.user_id))
      .where(inArray(workspaceMembers.id, memberIds)),
    loadPortalContactNames(
      reader,
      rows.map((row) => row.answered_by_portal_membership_id),
    ),
  ]);
  const names = new Map(members.map((member) => [member.id, member.name]));
  return new Map(
    [...grouped].map(([id, entries]) => [
      id,
      entries.map((row) =>
        feedbackClarificationMappingService.toInternalDto(row, names, contacts),
      ),
    ]),
  );
}

async function findOpen(
  tx: ContactDatabaseTransaction,
  itemId: string,
): Promise<FeedbackClarificationRow | null> {
  const [row] = await tx
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.item_id, itemId),
        eq(questions.status, FeedbackClarificationStatus.Open),
      ),
    )
    .for("update");
  return row ?? null;
}

async function findById(
  tx: ContactDatabaseTransaction,
  itemId: string,
  clarificationId: string,
): Promise<FeedbackClarificationRow | null> {
  const [row] = await tx
    .select()
    .from(questions)
    .where(
      and(eq(questions.item_id, itemId), eq(questions.id, clarificationId)),
    )
    .for("update");
  return row ?? null;
}

async function findByCommand(
  tx: ContactDatabaseReader,
  itemId: string,
  commandId: string,
): Promise<FeedbackClarificationRow | null> {
  const [row] = await tx
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.item_id, itemId),
        or(
          eq(questions.id, commandId),
          eq(questions.answer_command_id, commandId),
          eq(questions.close_command_id, commandId),
        ),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** A question id is globally unique; do not expose a foreign item's data to the caller. */
async function hasQuestionId(
  tx: ContactDatabaseReader,
  commandId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.id, commandId))
    .limit(1);
  return !!row;
}

async function insertOpen(
  tx: ContactDatabaseTransaction,
  input: {
    itemId: string;
    question: string;
    memberId: string;
    commandId: string;
    requestVersion: number;
    now: Date;
  },
): Promise<boolean> {
  const inserted = await tx
    .insert(questions)
    .values({
      id: input.commandId,
      item_id: input.itemId,
      status: FeedbackClarificationStatus.Open,
      question: input.question,
      requested_by_member_id: input.memberId,
      requested_at: input.now,
      request_version: input.requestVersion,
      answer: null,
      answered_by_portal_membership_id: null,
      answered_at: null,
      answer_command_id: null,
      answer_request_version: null,
      close_note: null,
      closed_by_member_id: null,
      closed_at: null,
      close_command_id: null,
      close_request_version: null,
      version: 1,
    })
    .onConflictDoNothing({ target: questions.id })
    .returning({ id: questions.id });
  return inserted.length === 1;
}

async function answer(
  tx: ContactDatabaseTransaction,
  input: {
    clarification: FeedbackClarificationRow;
    answer: string;
    portalMembershipId: string;
    commandId: string;
    requestVersion: number;
    now: Date;
  },
): Promise<void> {
  await updateLockedVersioned(
    {
      tx,
      table: questions,
      id: input.clarification.id,
      expectedVersion: input.clarification.version,
      patch: {
        status: FeedbackClarificationStatus.Answered,
        answer: input.answer,
        answered_by_portal_membership_id: input.portalMembershipId,
        answered_at: input.now,
        answer_command_id: input.commandId,
        answer_request_version: input.requestVersion,
      },
    },
    "Locked clarification changed while answering",
  );
}

async function close(
  tx: ContactDatabaseTransaction,
  input: {
    clarification: FeedbackClarificationRow;
    note: string;
    memberId: string;
    commandId: string;
    requestVersion: number;
    now: Date;
  },
): Promise<void> {
  await updateLockedVersioned(
    {
      tx,
      table: questions,
      id: input.clarification.id,
      expectedVersion: input.clarification.version,
      patch: {
        status: FeedbackClarificationStatus.Closed,
        close_note: input.note,
        closed_by_member_id: input.memberId,
        closed_at: input.now,
        close_command_id: input.commandId,
        close_request_version: input.requestVersion,
      },
    },
    "Locked clarification changed while closing",
  );
}

async function hasOpen(
  tx: ContactDatabaseReader,
  roundId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(feedbackRoundItems, eq(feedbackRoundItems.id, questions.item_id))
    .where(
      and(
        eq(feedbackRoundItems.round_id, roundId),
        eq(questions.status, FeedbackClarificationStatus.Open),
      ),
    )
    .limit(1);
  return !!row;
}

export const feedbackClarificationService = {
  loadByItems,
  loadInternalByItems,
  findOpen,
  findById,
  findByCommand,
  hasQuestionId,
  insertOpen,
  answer,
  close,
  hasOpen,
  writeItem,
  inspectCommand,
} as const;
