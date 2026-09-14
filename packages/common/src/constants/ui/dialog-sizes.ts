export const DialogSize = {
  Narrow: "narrow",
  Wide: "wide",
} as const;

export type DialogSize = (typeof DialogSize)[keyof typeof DialogSize];
