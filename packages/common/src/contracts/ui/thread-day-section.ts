import type { ThreadMessageGroup } from "./thread-message-group";

/** A calendar day of the thread with its groups. */
export type ThreadDaySection = {
  /** Local calendar day as `YYYY-MM-DD`. */
  dayKey: string;
  /** ISO time of the first row of the day, used for formatting. */
  firstAt: string;
  /** Speaker groups of this day in chronological order. */
  groups: ThreadMessageGroup[];
};
