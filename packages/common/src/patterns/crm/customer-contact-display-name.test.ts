import { describe, expect, it } from "vitest";

import { resolveCustomerContactDisplayName } from "@invessiv/common/patterns/crm/customer-contact-display-name";

describe("resolveCustomerContactDisplayName", () => {
  it("joins first and last name", () => {
    expect(
      resolveCustomerContactDisplayName({
        firstName: " Anna ",
        lastName: "Berger",
        email: "anna@example.test",
      }),
    ).toBe("Anna Berger");
  });

  it("uses a single name part on its own", () => {
    expect(
      resolveCustomerContactDisplayName({
        firstName: null,
        lastName: "Berger",
        email: null,
      }),
    ).toBe("Berger");
  });

  it("falls back to the email when no name is known", () => {
    expect(
      resolveCustomerContactDisplayName({
        firstName: "  ",
        lastName: null,
        email: "office@example.test",
      }),
    ).toBe("office@example.test");
  });

  it("returns an empty string when nothing identifies the contact", () => {
    expect(
      resolveCustomerContactDisplayName({
        firstName: null,
        lastName: null,
        email: null,
      }),
    ).toBe("");
  });
});
