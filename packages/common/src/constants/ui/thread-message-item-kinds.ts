export const ThreadMessageItemKind = {
  Message: "message",
  Pending: "pending",
} as const;

export type ThreadMessageItemKind =
  (typeof ThreadMessageItemKind)[keyof typeof ThreadMessageItemKind];
