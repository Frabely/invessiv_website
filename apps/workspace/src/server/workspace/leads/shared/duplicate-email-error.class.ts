import "server-only";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Duplicate lead email detected.");
    this.name = "DuplicateEmailError";
  }
}
