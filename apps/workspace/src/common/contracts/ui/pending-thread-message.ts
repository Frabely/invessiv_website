import type { PendingMessageStatus } from "@/common/constants/ui/pending-message-statuses";

/** A message the viewer sent that the server has not confirmed yet. */
export type PendingThreadMessage = {
  /** Client-generated key, stable across retries. */
  clientId: string;
  /** Trimmed text exactly as it will be sent again on retry. */
  body: string;
  /** Local time of the attempt, used for grouping and dividers. */
  createdAt: string;
  /** Whether the request is running or failed. */
  status: PendingMessageStatus;
};
