/** Tone of a status message inside a dialog; the dialogs style it via `data-tone`. */
export const DialogMessageTone = {
  Info: "info",
  Conflict: "conflict",
  Error: "error",
} as const;

export type DialogMessageTone =
  (typeof DialogMessageTone)[keyof typeof DialogMessageTone];

export const DIALOG_MESSAGE_TONE_VALUES = [
  DialogMessageTone.Info,
  DialogMessageTone.Conflict,
  DialogMessageTone.Error,
] as const;
