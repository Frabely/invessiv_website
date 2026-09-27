/** Every visible text of the shared message thread; each consumer supplies its own dictionary values. */
export type MessageThreadLabels = {
  /** Accessible name of the log region that holds the conversation. */
  logLabel: string;
  /** Shown when the conversation has no message yet. */
  emptyTitle: string;
  /** Explains who reads along in an empty conversation. */
  emptyBody: string;
  /** Button above the history for the previous page. */
  loadOlder: string;
  /** Busy label while older messages load. */
  loadingOlder: string;
  /** Jump button shown while reading further up and new messages arrive. */
  newMessages: string;
  /** Date divider for today. */
  today: string;
  /** Date divider for yesterday. */
  yesterday: string;
  /** Speaker label for the viewer's own messages. */
  own: string;
  /** Placeholder replacing hidden message content. */
  redacted: string;
  /** Fallback for a system event without a known text. */
  systemFallback: string;
  /** Status of an optimistic message that is still on its way. */
  sending: string;
  /** Status of a message that could not be delivered. */
  failed: string;
  /** Action for a failed message. */
  retry: string;
  /** Action that hides a message; only shown when the consumer allows it. */
  redact: string;
  /** Accessible name of the text field. */
  inputLabel: string;
  /** Placeholder of the text field. */
  inputPlaceholder: string;
  /** Hint about Enter and Shift+Enter below the field. */
  inputHint: string;
  /** Send button text. */
  send: string;
  /** Character counter, receives `{count}` and `{max}`. */
  characterCount: string;
};
