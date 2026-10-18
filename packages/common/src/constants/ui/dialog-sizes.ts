export const DialogSize = {
  Narrow: "narrow",
  Wide: "wide",
  /** For a table with several columns that would be cramped in `wide`. */
  Large: "large",
  Full: "full",
} as const;

export type DialogSize = (typeof DialogSize)[keyof typeof DialogSize];
