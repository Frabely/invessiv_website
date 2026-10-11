import "server-only";

import { desc, sql, type SQL } from "drizzle-orm";

import {
  encodeTimeEntryCursor,
  type TimeEntryCursor,
} from "@invessiv/common/patterns/crm/hours/time-entry-cursor";
import { projectTimeEntries } from "@invessiv/db/record-configuration";

/** Postgres keeps microseconds, the cursor travels as a JS timestamp: both sides compare in milliseconds. */
const bookedAt = sql`date_trunc('milliseconds', ${projectTimeEntries.created_at})`;

/** Newest first; the booking instant and the id break ties among entries of one day. */
const newestFirst = [
  desc(projectTimeEntries.performed_on),
  desc(bookedAt),
  desc(projectTimeEntries.id),
];

/** Everything strictly older than the cursor; undefined for the first page. */
function after(cursor: TimeEntryCursor | null): SQL | undefined {
  if (!cursor) return undefined;
  return sql`(${projectTimeEntries.performed_on}, ${bookedAt}, ${projectTimeEntries.id}) < (${cursor.performedOn}::date, ${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`;
}

/**
 * `rows` were read with one row beyond `pageSize`; that extra row only tells whether an older
 * entry exists. The cursor is the sort key of the last entry actually shown.
 */
function nextCursor(
  rows: readonly { id: string; performed_on: string; created_at: Date }[],
  pageSize: number,
): string | null {
  const last = rows[pageSize - 1];
  if (rows.length <= pageSize || !last) return null;
  return encodeTimeEntryCursor({
    performedOn: last.performed_on,
    createdAt: last.created_at.toISOString(),
    id: last.id,
  });
}

/** Keyset paging of time entry lists, shared by the cockpit and the portal. */
export const timeEntryPageService = { newestFirst, after, nextCursor } as const;
