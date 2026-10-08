const SEPARATOR = "~";
const CURSOR_PATTERN =
  /^(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)~([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** The sort position of one time entry: day, booking instant (to the millisecond) and id. */
export type TimeEntryCursor = {
  performedOn: string;
  createdAt: string;
  id: string;
};

/**
 * Lists of time entries page by keyset, not by offset: an entry booked or deleted while someone
 * reads must neither repeat nor swallow a neighbour. The cursor is exactly the sort key of the
 * last entry shown.
 */
export function encodeTimeEntryCursor(cursor: TimeEntryCursor): string {
  return [cursor.performedOn, cursor.createdAt, cursor.id].join(SEPARATOR);
}

/** Null for anything that is not a cursor this module wrote; callers answer with a validation error. */
export function decodeTimeEntryCursor(value: string): TimeEntryCursor | null {
  const match = CURSOR_PATTERN.exec(value);
  if (!match) return null;
  return { performedOn: match[1], createdAt: match[2], id: match[3] };
}
