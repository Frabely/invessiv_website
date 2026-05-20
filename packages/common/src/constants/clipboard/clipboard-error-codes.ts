export const ClipboardErrorCode = {
  Unavailable: "CLIPBOARD_UNAVAILABLE",
} as const;

export type ClipboardErrorCode =
  (typeof ClipboardErrorCode)[keyof typeof ClipboardErrorCode];
