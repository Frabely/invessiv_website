import "server-only";

export class DuplicateSocialProfileError extends Error {
  constructor() {
    super("Duplicate lead social profile detected.");
    this.name = "DuplicateSocialProfileError";
  }
}
