export const BulkSubmitFailureKind = {
  Network: "network",
  Server: "server",
} as const;

export type BulkSubmitFailureKind =
  (typeof BulkSubmitFailureKind)[keyof typeof BulkSubmitFailureKind];
