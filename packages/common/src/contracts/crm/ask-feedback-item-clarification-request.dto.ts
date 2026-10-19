export type AskFeedbackItemClarificationRequestDto = {
  /** Unique identifier for this explicit action, retained across retries. */
  commandId: string;
  /** Expected item version, not the round or clarification version. */
  version: number;
  /** Nonempty plain text, trimmed and limited to 2000 characters. */
  question: string;
};
