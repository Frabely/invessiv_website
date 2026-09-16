import { describe, expect, it } from "vitest";

import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { createCustomerRequestFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";

describe("customerSchemas.create", () => {
  it("trims text and turns empty strings into null", () => {
    const result = customerSchemas.create.parse({
      ...createCustomerRequestFixture(),
      displayName: "  Nordlicht Coaching ",
      street: "   ",
      city: "",
    });

    expect(result.displayName).toBe("Nordlicht Coaching");
    expect(result.street).toBeNull();
    expect(result.city).toBeNull();
  });

  it("accepts omitted optional fields as null", () => {
    const result = customerSchemas.create.parse({
      customerType: "individual",
      displayName: "Dario Lentz",
      primaryContact: {
        lastName: "Lentz",
        preferredLocale: "en",
      },
    });

    expect(result).toMatchObject({
      companyName: null,
      categoryId: null,
      websiteUrl: null,
      defaultHourlyRateCents: null,
      primaryContact: { firstName: null, email: null, roleLabel: null },
    });
  });

  it("drops the company name of an individual", () => {
    const result = customerSchemas.create.parse({
      ...createCustomerRequestFixture(),
      customerType: "individual",
      companyName: "Stale GmbH",
    });

    expect(result.companyName).toBeNull();
  });

  it("strips status and owner from the body", () => {
    const result = customerSchemas.create.parse({
      ...createCustomerRequestFixture(),
      status: "archived",
      ownerMemberId: "someone-else",
    });

    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("ownerMemberId");
  });

  it("requires a last name or an email on the primary contact", () => {
    const result = customerSchemas.create.safeParse({
      ...createCustomerRequestFixture(),
      primaryContact: {
        firstName: "Anna",
        lastName: " ",
        email: null,
        phone: null,
        roleLabel: null,
        preferredLocale: "de",
      },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([
      "primaryContact",
      "lastName",
    ]);
  });

  it.each([
    ["a blank display name", { displayName: "  " }],
    ["a non-http website", { websiteUrl: "ftp://nordlicht.example" }],
    ["a negative hourly rate", { defaultHourlyRateCents: -1 }],
    ["a fractional hourly rate", { defaultHourlyRateCents: 12.5 }],
    ["a malformed category id", { categoryId: "sales" }],
  ])("rejects %s", (_case, overrides) => {
    expect(
      customerSchemas.create.safeParse({
        ...createCustomerRequestFixture(),
        ...overrides,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid contact email and phone", () => {
    const result = customerSchemas.create.safeParse({
      ...createCustomerRequestFixture(),
      primaryContact: {
        ...createCustomerRequestFixture().primaryContact,
        email: "anna@",
        phone: "call me",
      },
    });

    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["primaryContact.email", "primaryContact.phone"]),
    );
  });
});

describe("customerSchemas.update", () => {
  it("requires a positive version and ignores contact fields", () => {
    const { primaryContact, ...fields } = createCustomerRequestFixture();

    expect(customerSchemas.update.safeParse(fields).success).toBe(false);
    expect(
      customerSchemas.update.safeParse({ ...fields, version: 0 }).success,
    ).toBe(false);

    const result = customerSchemas.update.parse({
      ...fields,
      primaryContact,
      version: 2,
    });
    expect(result.version).toBe(2);
    expect(result).not.toHaveProperty("primaryContact");
  });
});
