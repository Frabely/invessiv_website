/**
 * A stored result always carries who set it and when; without both, the first history entry cannot
 * record the state it replaces.
 */
export class FeedbackResultBaselineMissingError extends Error {
  constructor() {
    super("Result metadata missing for history baseline");
    this.name = "FeedbackResultBaselineMissingError";
  }
}
