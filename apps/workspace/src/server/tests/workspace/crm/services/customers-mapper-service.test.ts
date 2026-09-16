import { describe, expect, it } from "vitest";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { CustomerContactAssignmentRow } from "@invessiv/common/contracts/crm/rows/customer-contact-assignment-row";
import type { CustomerDetailRow } from "@invessiv/common/contracts/crm/rows/customer-detail-row";
import type { CustomerSummaryRow } from "@invessiv/common/contracts/crm/rows/customer-summary-row";
import { customersMapperService } from "@/server/workspace/crm/services/customers-mapper-service";
import { MissingPrimaryContactError } from "@/server/workspace/crm/shared/missing-primary-contact-error.class";

const CREATED = new Date("2026-03-01T12:00:00.000Z");
const UPDATED = new Date("2026-04-02T08:30:00.000Z");

const summaryRow = {
  id: "customer-1",
  customer_number: 42,
  display_name: "Müller GmbH",
  company_name: "Müller GmbH",
  status: CustomerStatus.Active,
  owner_member_id: "member-1",
  owner_display_name: "Moritz Beispiel",
  category_id: "category-1",
  city: "Köln",
  created_at: CREATED,
  updated_at: UPDATED,
} satisfies CustomerSummaryRow;

const detailRow = {
  ...summaryRow,
  street: "Hauptstraße 1",
  postal_code: "50667",
  country: "DE",
  website_url: "https://mueller.example.com",
  vat_id: "DE123456789",
  notes: "Returning customer",
  default_hourly_rate_cents: 9500,
  retention_review_after_days: 180,
  version: 3,
} satisfies CustomerDetailRow;

const primaryContact = {
  id: "assignment-1",
  person_id: "person-1",
  display_name: "Anna Müller",
  first_name: "Anna",
  last_name: "Müller",
  primary_email: "anna@privat.example.com",
  primary_phone: "+49 221 111",
  business_email: "anna@mueller.example.com",
  business_phone: "+49 221 222",
  role_label: "Geschäftsführung",
  is_primary: true,
  preferred_locale: Locale.De,
  assignment_version: 2,
  person_version: 3,
  created_at: CREATED,
  updated_at: UPDATED,
} satisfies CustomerContactAssignmentRow;

const secondaryContact = {
  ...primaryContact,
  id: "assignment-2",
  person_id: "person-2",
  display_name: "Ben Beispiel",
  first_name: "Ben",
  last_name: "Beispiel",
  primary_email: null,
  primary_phone: null,
  business_email: null,
  business_phone: null,
  role_label: null,
  is_primary: false,
  preferred_locale: Locale.En,
} satisfies CustomerContactAssignmentRow;

describe("customersMapperService.toSummary", () => {
  it("maps snake_case to camelCase and formats timestamps as ISO", () => {
    const result = customersMapperService.toSummary(summaryRow, [
      primaryContact,
    ]);

    expect(result).toEqual({
      id: "customer-1",
      customerNumber: 42,
      displayName: "Müller GmbH",
      companyName: "Müller GmbH",
      status: "active",
      ownerMemberId: "member-1",
      ownerDisplayName: "Moritz Beispiel",
      categoryId: "category-1",
      city: "Köln",
      primaryContactName: "Anna Müller",
      primaryContactEmail: "anna@mueller.example.com",
      createdAt: "2026-03-01T12:00:00.000Z",
      updatedAt: "2026-04-02T08:30:00.000Z",
    });
  });

  it("keeps the customer number a number", () => {
    const result = customersMapperService.toSummary(summaryRow, [
      primaryContact,
    ]);

    expect(result.customerNumber).toBe(42);
    expect(typeof result.customerNumber).toBe("number");
  });

  it("prefers the business email and falls back to the personal one", () => {
    const withoutBusinessEmail = {
      ...primaryContact,
      business_email: null,
    } satisfies CustomerContactAssignmentRow;

    expect(
      customersMapperService.toSummary(summaryRow, [withoutBusinessEmail])
        .primaryContactEmail,
    ).toBe("anna@privat.example.com");
  });

  it("returns null when the primary contact has no email address", () => {
    const withoutEmail = {
      ...primaryContact,
      business_email: null,
      primary_email: null,
    } satisfies CustomerContactAssignmentRow;

    expect(
      customersMapperService.toSummary(summaryRow, [withoutEmail])
        .primaryContactEmail,
    ).toBeNull();
  });

  it("picks the primary contact regardless of order", () => {
    const result = customersMapperService.toSummary(summaryRow, [
      secondaryContact,
      primaryContact,
    ]);

    expect(result.primaryContactName).toBe("Anna Müller");
  });

  it("throws when no primary contact is present", () => {
    expect(() =>
      customersMapperService.toSummary(summaryRow, [secondaryContact]),
    ).toThrow(MissingPrimaryContactError);
  });

  it("throws for a completely empty contact list too", () => {
    expect(() => customersMapperService.toSummary(summaryRow, [])).toThrow(
      MissingPrimaryContactError,
    );
  });

  it("names the affected customer id in the error", () => {
    try {
      customersMapperService.toSummary(summaryRow, []);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(MissingPrimaryContactError);
      expect((error as MissingPrimaryContactError).customerId).toBe(
        "customer-1",
      );
    }
  });

  it("maps an individual customer without a company name", () => {
    const individual = {
      ...summaryRow,
      company_name: null,
      display_name: "Anna Müller",
    } satisfies CustomerSummaryRow;

    const result = customersMapperService.toSummary(individual, [
      primaryContact,
    ]);

    expect(result.companyName).toBeNull();
  });
});

describe("customersMapperService.toDetail", () => {
  it("adds the detail fields and all contacts", () => {
    const result = customersMapperService.toDetail(detailRow, [
      primaryContact,
      secondaryContact,
    ]);

    expect(result.street).toBe("Hauptstraße 1");
    expect(result.postalCode).toBe("50667");
    expect(result.defaultHourlyRateCents).toBe(9500);
    expect(result.retentionReviewAfterDays).toBe(180);
    expect(result.version).toBe(3);
    expect(result.contacts).toHaveLength(2);
    expect(result.contacts.map((contact) => contact.id)).toEqual([
      "assignment-1",
      "assignment-2",
    ]);
  });

  it("passes null fields through as null instead of dropping them", () => {
    const sparse = {
      ...detailRow,
      street: null,
      postal_code: null,
      country: null,
      website_url: null,
      vat_id: null,
      notes: null,
      default_hourly_rate_cents: null,
      retention_review_after_days: null,
      city: null,
      category_id: null,
      company_name: null,
    } satisfies CustomerDetailRow;

    const result = customersMapperService.toDetail(sparse, [primaryContact]);

    expect(result.street).toBeNull();
    expect(result.vatId).toBeNull();
    expect(result.defaultHourlyRateCents).toBeNull();
    expect(result.retentionReviewAfterDays).toBeNull();
    expect(result.categoryId).toBeNull();
    expect(result.city).toBeNull();
  });
});

describe("customersMapperService.toContact", () => {
  it("separates personal from business contact details", () => {
    const result = customersMapperService.toContact(primaryContact);

    expect(result).toEqual({
      id: "assignment-1",
      personId: "person-1",
      displayName: "Anna Müller",
      firstName: "Anna",
      lastName: "Müller",
      primaryEmail: "anna@privat.example.com",
      primaryPhone: "+49 221 111",
      businessEmail: "anna@mueller.example.com",
      businessPhone: "+49 221 222",
      roleLabel: "Geschäftsführung",
      isPrimary: true,
      preferredLocale: "de",
      assignmentVersion: 2,
      personVersion: 3,
      createdAt: "2026-03-01T12:00:00.000Z",
      updatedAt: "2026-04-02T08:30:00.000Z",
    });
  });

  it("passes through the person's portal locale", () => {
    expect(
      customersMapperService.toContact(secondaryContact).preferredLocale,
    ).toBe("en");
  });
});
