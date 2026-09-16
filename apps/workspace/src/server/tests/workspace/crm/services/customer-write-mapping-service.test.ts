import { describe, expect, it } from "vitest";

import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerWriteMappingService } from "@/server/workspace/crm/services/customer-write-mapping-service";
import {
  createCustomerRequestFixture,
  TEST_CATEGORY_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

const FULL_INPUT = customerSchemas.create.parse(
  createCustomerRequestFixture({
    categoryId: TEST_CATEGORY_ID,
    street: "Ehrenstraße 12",
    postalCode: "50672",
    country: "Deutschland",
    websiteUrl: "https://nordlicht.example",
    vatId: "DE123456789",
    notes: "Kommt über Empfehlung",
    defaultHourlyRateCents: 9500,
  }),
);

describe("customerWriteMappingService", () => {
  it("maps every customer field and sets the managed values on create", () => {
    expect(
      customerWriteMappingService.mapCreateCustomerApiToDb(
        "customer-1",
        FULL_INPUT,
        "member-1",
      ),
    ).toEqual({
      id: "customer-1",
      display_name: "Nordlicht Coaching",
      company_name: "Nordlicht Coaching GmbH",
      category_id: TEST_CATEGORY_ID,
      street: "Ehrenstraße 12",
      postal_code: "50672",
      city: "Köln",
      country: "Deutschland",
      website_url: "https://nordlicht.example",
      vat_id: "DE123456789",
      notes: "Kommt über Empfehlung",
      default_hourly_rate_cents: 9500,
      status: "active",
      owner_member_id: "member-1",
      retention_review_after_days: null,
      version: 1,
    });
  });

  it("keeps nullable fields null", () => {
    const input = customerSchemas.create.parse({
      displayName: "Dario Lentz",
      primaryContact: { email: "dario@example.test", preferredLocale: "en" },
    });

    expect(
      customerWriteMappingService.mapCreateCustomerApiToDb("c", input, "m"),
    ).toMatchObject({
      company_name: null,
      category_id: null,
      street: null,
      website_url: null,
      default_hourly_rate_cents: null,
    });
    expect(
      customerWriteMappingService.mapContactApiToPersonDb(
        "p",
        input.primaryContact,
      ),
    ).toMatchObject({
      display_name: "dario@example.test",
      first_name: null,
      last_name: null,
      primary_phone: null,
    });
  });

  it("never patches status, owner or version on update", () => {
    const patch = customerWriteMappingService.mapUpdateCustomerApiToDb({
      ...FULL_INPUT,
      version: 4,
    });

    expect(patch).toMatchObject({ display_name: "Nordlicht Coaching" });
    expect(patch).not.toHaveProperty("status");
    expect(patch).not.toHaveProperty("owner_member_id");
    expect(patch).not.toHaveProperty("version");
  });

  it("maps the primary contact to a new person with a derived display name", () => {
    expect(
      customerWriteMappingService.mapContactApiToPersonDb(
        "person-1",
        FULL_INPUT.primaryContact,
      ),
    ).toEqual({
      id: "person-1",
      display_name: "Anna Berger",
      first_name: "Anna",
      last_name: "Berger",
      primary_email: "anna@nordlicht.example",
      primary_phone: null,
      preferred_locale: "de",
      notes: null,
      version: 1,
    });
  });

  it("keeps the role on a primary assignment without business details", () => {
    expect(
      customerWriteMappingService.mapContactApiToAssignmentDb(
        "assignment-1",
        "customer-1",
        "person-1",
        FULL_INPUT.primaryContact,
        true,
      ),
    ).toEqual({
      id: "assignment-1",
      customer_id: "customer-1",
      person_id: "person-1",
      role_label: "Geschäftsführung",
      business_email: null,
      business_phone: null,
      is_primary: true,
      version: 1,
    });
  });
});
