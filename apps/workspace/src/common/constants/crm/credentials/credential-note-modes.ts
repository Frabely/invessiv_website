/** What the form does with the note of an existing entry. A new entry is always `Edit`. */
export const CredentialNoteMode = {
  /** The stored note stays untouched and is never loaded into the form. */
  Keep: "keep",
  /** The textarea holds the note that will be stored; empty removes or omits it. */
  Edit: "edit",
  Remove: "remove",
} as const;

export type CredentialNoteMode =
  (typeof CredentialNoteMode)[keyof typeof CredentialNoteMode];
