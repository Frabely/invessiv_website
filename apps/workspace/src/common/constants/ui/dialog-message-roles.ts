/** ARIA live role of a dialog message: `status` announces politely, `alert` interrupts. */
export const DialogMessageRole = {
  Status: "status",
  Alert: "alert",
} as const;

export type DialogMessageRole =
  (typeof DialogMessageRole)[keyof typeof DialogMessageRole];
