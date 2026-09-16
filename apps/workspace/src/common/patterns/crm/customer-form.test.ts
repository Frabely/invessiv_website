import { describe, expect, it } from "vitest";

import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import {
  createCustomerFormValues,
  toCreateCustomerRequest,
  toUpdateCustomerRequest,
  validateCustomerForm,
} from "@/common/patterns/crm/customer-form";

const CUSTOMER: CustomerDetailDto = {
  id: "customer-1",
  customerNumber: 7,
  displayName: "Nordlicht Coaching",
  companyName: "Nordlicht Coaching GmbH",
  status: "active",
  ownerMemberId: "member-1",
  ownerDisplayName: "Moritz Beispiel",
  categoryId: null,
  city: "Köln",
  primaryContactName: "Anna Berger",
  primaryContactEmail: null,
  createdAt: "2026-09-14T10:00:00.000Z",
  updatedAt: "2026-09-14T10:00:00.000Z",
  street: null,
  postalCode: null,
  country: null,
  websiteUrl: "https://nordlicht.example",
  vatId: null,
  notes: null,
  defaultHourlyRateCents: 9550,
  retentionReviewAfterDays: null,
  version: 3,
  contacts: [],
};

describe("createCustomerFormValues", () => {
  it("starts an empty form in the current language", () => {
    const values = createCustomerFormValues(null, "en");

    expect(values.displayName).toBe("");
    expect(values.contactPreferredLocale).toBe("en");
    expect(values.status).toBe("active");
  });

  it("prefills an existing customer including the euro amount", () => {
    const values = createCustomerFormValues(CUSTOMER, "de");

    expect(values.displayName).toBe("Nordlicht Coaching");
    expect(values.companyName).toBe("Nordlicht Coaching GmbH");
    expect(values.city).toBe("Köln");
    expect(values.hourlyRate).toBe("95,50");
    expect(values.status).toBe("active");
  });
});

describe("validateCustomerForm", () => {
  it("requires a display name and contact last name on create", () => {
    const errors = validateCustomerForm(
      createCustomerFormValues(null, "de"),
      "create",
    );

    expect(errors).toEqual({
      displayName: "displayNameRequired",
      contactLastName: "contactLastNameRequired",
    });
  });

  it("requires a last name even when an email is set", () => {
    const values = {
      ...createCustomerFormValues(null, "de"),
      displayName: "Kluge Bau",
      contactEmail: "office@kluge.example",
    };

    expect(validateCustomerForm(values, "create")).toEqual({
      contactLastName: "contactLastNameRequired",
    });
  });

  it("reports invalid formats", () => {
    const values = {
      ...createCustomerFormValues(null, "de"),
      displayName: "Kluge Bau",
      contactLastName: "Kluge",
      contactEmail: "kluge@",
      contactPhone: "abc",
      websiteUrl: "ftp://kluge.example",
      hourlyRate: "12,345",
    };

    expect(validateCustomerForm(values, "create")).toEqual({
      contactEmail: "emailInvalid",
      contactPhone: "phoneInvalid",
      websiteUrl: "urlInvalid",
      hourlyRate: "hourlyRateInvalid",
    });
  });

  it("ignores contact fields when editing", () => {
    expect(
      validateCustomerForm(createCustomerFormValues(CUSTOMER, "de"), "edit"),
    ).toEqual({});
  });
});

describe("request mapping", () => {
  it("trims, nulls empty fields and converts the hourly rate", () => {
    const request = toCreateCustomerRequest({
      ...createCustomerFormValues(null, "de"),
      displayName: "  Kluge Bau ",
      companyName: " ",
      hourlyRate: "80",
      contactLastName: " Kluge ",
      contactRoleLabel: "Inhaber",
    });

    expect(request).toMatchObject({
      displayName: "Kluge Bau",
      companyName: null,
      city: null,
      defaultHourlyRateCents: 8000,
      primaryContact: {
        firstName: null,
        lastName: "Kluge",
        roleLabel: "Inhaber",
        preferredLocale: "de",
      },
    });
  });

  it("sends the version on update", () => {
    const request = toUpdateCustomerRequest(
      createCustomerFormValues(CUSTOMER, "de"),
      3,
    );

    expect(request.companyName).toBe("Nordlicht Coaching GmbH");
    expect(request.status).toBe("active");
    expect(request.version).toBe(3);
    expect(request).not.toHaveProperty("primaryContact");
  });
});
