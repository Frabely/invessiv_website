import type { ThreadMessageItem } from "./thread-message-item";

/** Consecutive rows of the same sender within the grouping window. */
export type ThreadMessageGroup = {
  /** Key of the first row, stable while the group grows. */
  key: string;
  /** Group of a system event; rendered without a bubble. */
  isSystem: boolean;
  /** Group written by the viewer (confirmed or pending). */
  isOwn: boolean;
  /** Name shown in the group head. */
  senderDisplayName: string;
  /** ISO time of the first row, shown in the group head. */
  startedAt: string;
  /** Rows in chronological order. */
  items: ThreadMessageItem[];
};
