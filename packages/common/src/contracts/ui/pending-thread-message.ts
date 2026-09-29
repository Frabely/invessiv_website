import type { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import type { ComposerAttachment } from "./composer-attachment";

/** A message the viewer sent that the server has not confirmed yet. */
export type PendingThreadMessage = {
  /** Client-generated key, stable across retries. */
  clientId: string;
  /** Trimmed text exactly as it will be sent again on retry; empty with attachments only. */
  body: string;
  /** Sent again unchanged on retry, so a retry is recognised as the same send. */
  attachments: ComposerAttachment[];
  /** Local time of the attempt, used for grouping and dividers. */
  createdAt: string;
  /** Whether the request is running or failed. */
  status: PendingMessageStatus;
};
