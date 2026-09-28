/** Form state of the edit dialog; the note is kept as typed and trimmed on submit. */
export type FileEditValues = {
  projectId: string | null;
  visibleToCustomer: boolean;
  note: string;
};
