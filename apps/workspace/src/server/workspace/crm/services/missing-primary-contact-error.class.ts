/**
 * An invariant violation, not a business error: a customer without a primary contact is
 * impossible per schema and create command (Task 01, Task 04). If one reaches the mapper,
 * the query is wrong — not the view.
 *
 * Deliberately thrown instead of returned as a result code: it never reaches a client,
 * because there is no user action that could resolve it.
 */
export class MissingPrimaryContactError extends Error {
  constructor(readonly customerId: string) {
    super(
      `Customer ${customerId} has no primary contact. The schema allows at most one and the create command enforces at least one, so the query is returning incomplete data.`,
    );
    this.name = "MissingPrimaryContactError";
  }
}
