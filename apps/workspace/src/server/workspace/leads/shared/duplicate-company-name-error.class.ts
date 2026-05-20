export class DuplicateCompanyNameError extends Error {
  constructor() {
    super("Duplicate lead company name detected.");
    this.name = "DuplicateCompanyNameError";
  }
}
