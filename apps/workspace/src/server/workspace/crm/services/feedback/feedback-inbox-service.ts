import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  FeedbackRoundStatus,
  INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES,
} from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackInboxCustomerDto } from "@invessiv/common/contracts/crm/feedback-inbox-customer.dto";
import {
  type ContactDatabaseTransaction,
  sqlCheckIn,
  type ContactDatabaseReader,
} from "@invessiv/db/core";
import {
  customers,
  feedbackRoundItems,
  feedbackRounds,
  files,
  projects,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import type { FeedbackInboxRow } from "./feedback-round-types";

const EXCERPT_LENGTH = 280;

function readableRounds(actor: WorkspaceActor): SQL | undefined {
  return crmAccessCondition.forScope(
    accessScope(actor, Permission.ProjectsRead),
    {
      customerId: feedbackRounds.customer_id,
      projectId: feedbackRounds.project_id,
    },
  );
}

/** Unread is the inbox notion: submitted and not yet opened by any member. */
function unreadCondition(): SQL {
  return and(
    eq(feedbackRounds.status, FeedbackRoundStatus.Submitted),
    isNull(feedbackRounds.read_at),
  )!;
}

function queueCondition(actor: WorkspaceActor): SQL {
  return and(
    sqlCheckIn(
      feedbackRounds.status,
      INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES,
    ),
    readableRounds(actor),
  )!;
}

/**
 * One statement for the whole inbox: item count, readable file count and the first item's text
 * come from correlated subqueries, so the list never issues a query per round.
 */
async function list(
  executor: ContactDatabaseReader,
  filters: FeedbackInboxFilters,
  actor: WorkspaceActor,
): Promise<FeedbackInboxRow[]> {
  const itemCount = executor
    .select({ value: count() })
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, feedbackRounds.id));
  const fileCount = executor
    .select({ value: count() })
    .from(files)
    .where(
      and(
        eq(files.feedback_round_id, feedbackRounds.id),
        fileAccessService.readableCondition(actor),
      ),
    );
  const excerpt = executor
    .select({
      value: sql<
        string | null
      >`nullif(btrim(left(${feedbackRoundItems.body}, ${EXCERPT_LENGTH})), '')`,
    })
    .from(feedbackRoundItems)
    .where(eq(feedbackRoundItems.round_id, feedbackRounds.id))
    .orderBy(asc(feedbackRoundItems.position))
    .limit(1);
  const unread = sql<boolean>`(${unreadCondition()})`;

  return executor
    .select({
      round: feedbackRounds,
      customerDisplayName: customers.display_name,
      projectTitle: projects.title,
      unread,
      itemCount: sql<number>`(${itemCount})`.mapWith(Number),
      fileCount: sql<number>`(${fileCount})`.mapWith(Number),
      excerpt: sql<string | null>`(${excerpt})`,
    })
    .from(feedbackRounds)
    .innerJoin(customers, eq(customers.id, feedbackRounds.customer_id))
    .innerJoin(projects, eq(projects.id, feedbackRounds.project_id))
    .where(
      and(
        queueCondition(actor),
        filters.status ? eq(feedbackRounds.status, filters.status) : undefined,
        filters.unreadOnly ? unreadCondition() : undefined,
        filters.customerId
          ? eq(feedbackRounds.customer_id, filters.customerId)
          : undefined,
      ),
    )
    .orderBy(
      desc(unread),
      asc(feedbackRounds.submitted_at),
      asc(feedbackRounds.id),
    );
}

/** Filter options come from the unfiltered queue, so choosing a customer never hides the others. */
async function listCustomers(
  executor: ContactDatabaseReader,
  actor: WorkspaceActor,
): Promise<FeedbackInboxCustomerDto[]> {
  return executor
    .select({ id: customers.id, displayName: customers.display_name })
    .from(feedbackRounds)
    .innerJoin(customers, eq(customers.id, feedbackRounds.customer_id))
    .where(queueCondition(actor))
    .groupBy(customers.id)
    .orderBy(asc(customers.display_name), asc(customers.id));
}

async function countUnread(
  executor: ContactDatabaseReader,
  actor: WorkspaceActor,
): Promise<number> {
  const [result] = await executor
    .select({ value: count() })
    .from(feedbackRounds)
    .where(and(unreadCondition(), readableRounds(actor)));
  return result?.value ?? 0;
}

/** The round must be readable for the member; unknown and foreign rounds answer the same. */
async function findReadable(
  executor: ContactDatabaseReader,
  roundId: string,
  actor: WorkspaceActor,
): Promise<{ id: string; customerId: string; projectId: string } | null> {
  const [round] = await executor
    .select({
      id: feedbackRounds.id,
      customerId: feedbackRounds.customer_id,
      projectId: feedbackRounds.project_id,
    })
    .from(feedbackRounds)
    .where(and(eq(feedbackRounds.id, roundId), readableRounds(actor)))
    .limit(1);
  return round ?? null;
}

/**
 * Stamps the first opening after a submission. An open round is never stamped: the customer may
 * still submit it, and that submission has to show up as new. Neither version nor activity change.
 */
async function markRead(
  executor: Pick<ContactDatabaseTransaction, "update">,
  roundId: string,
  expectedVersion: number,
): Promise<boolean> {
  const marked = await executor
    .update(feedbackRounds)
    .set({ read_at: sql`now()` })
    .where(
      and(
        eq(feedbackRounds.id, roundId),
        eq(feedbackRounds.version, expectedVersion),
        isNull(feedbackRounds.read_at),
        ne(feedbackRounds.status, FeedbackRoundStatus.Open),
      ),
    )
    .returning({ id: feedbackRounds.id });
  return marked.length > 0;
}

export const feedbackInboxService = {
  list,
  listCustomers,
  countUnread,
  findReadable,
  unreadCondition,
  markRead,
} as const;
