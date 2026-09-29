/**
 * Item ids come from the client. One that already belongs to another round is a client error; the
 * command catches this in a savepoint and answers with a validation error.
 */
export class FeedbackItemIdTakenError extends Error {
  constructor() {
    super("Feedback item id already belongs to another round");
    this.name = "FeedbackItemIdTakenError";
  }
}
