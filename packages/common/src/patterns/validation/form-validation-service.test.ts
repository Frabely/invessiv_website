import { describe, expect, it } from "vitest";

import { formValidationService } from "@invessiv/common/patterns/validation/form-validation-service";

describe("formValidationService", () => {
  it("accepts valid contact emails and rejects malformed ones", () => {
    expect(formValidationService.isValidEmail("name@example.com")).toBe(true);
    expect(formValidationService.isValidEmail("not an email")).toBe(false);
  });

  it("only accepts HTTP(S) URLs", () => {
    expect(formValidationService.isValidHttpUrl("https://example.com")).toBe(
      true,
    );
    expect(
      formValidationService.isValidHttpUrl("mailto:name@example.com"),
    ).toBe(false);
  });
});
