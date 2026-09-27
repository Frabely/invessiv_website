/** Marks an activity as belonging to a message; the body is never copied into the log. */
export const MESSAGE_ACTIVITY_ENTITY = "message";

/** Marks an activity as belonging to a conversation, e.g. a change of the responsible member. */
export const CONVERSATION_ACTIVITY_ENTITY = "conversation";

/** Changes to an existing message that are recorded as an activity. */
export const MessageActivityChange = {
  Redacted: "redacted",
} as const;

export type MessageActivityChange =
  (typeof MessageActivityChange)[keyof typeof MessageActivityChange];
