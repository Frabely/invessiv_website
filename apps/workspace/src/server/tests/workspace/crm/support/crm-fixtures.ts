import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";

export const TEST_CUSTOMER_ID = "0b8a5f7e-3f2d-4c1b-9a8e-7d6c5b4a3f21";
export const TEST_CATEGORY_ID = "5c2d1e0f-8a7b-4c6d-9e5f-4a3b2c1d0e9f";

export function customerDetailFixture(
  overrides: Partial<CustomerDetailDto> = {},
): CustomerDetailDto {
  return {
    id: TEST_CUSTOMER_ID,
    customerNumber: 7,
    displayName: "Nordlicht Coaching",
    companyName: "Nordlicht Coaching GmbH",
    status: "active",
    ownerMemberId: "member-actor-uuid",
    ownerDisplayName: "Moritz Beispiel",
    categoryId: null,
    city: "Köln",
    primaryContactName: "Anna Berger",
    primaryContactEmail: "anna@nordlicht.example",
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
    street: null,
    postalCode: null,
    country: null,
    websiteUrl: null,
    vatId: null,
    notes: null,
    defaultHourlyRateCents: null,
    retentionReviewAfterDays: null,
    version: 1,
    contacts: [],
    ...overrides,
  };
}

export function createCustomerRequestFixture(
  overrides: Partial<CreateCustomerRequestDto> = {},
): CreateCustomerRequestDto {
  return {
    displayName: "Nordlicht Coaching",
    companyName: "Nordlicht Coaching GmbH",
    categoryId: null,
    street: null,
    postalCode: null,
    city: "Köln",
    country: null,
    websiteUrl: null,
    vatId: null,
    notes: null,
    defaultHourlyRateCents: null,
    primaryContact: {
      firstName: "Anna",
      lastName: "Berger",
      email: "anna@nordlicht.example",
      phone: null,
      roleLabel: "Geschäftsführung",
      preferredLocale: "de",
    },
    ...overrides,
  };
}

export function updateCustomerRequestFixture(
  overrides: Partial<UpdateCustomerRequestDto> = {},
): UpdateCustomerRequestDto {
  const request = createCustomerRequestFixture();
  return {
    displayName: request.displayName,
    companyName: request.companyName,
    categoryId: request.categoryId,
    street: request.street,
    postalCode: request.postalCode,
    city: request.city,
    country: request.country,
    websiteUrl: request.websiteUrl,
    vatId: request.vatId,
    notes: request.notes,
    defaultHourlyRateCents: request.defaultHourlyRateCents,
    status: "active",
    version: 1,
    ...overrides,
  };
}
