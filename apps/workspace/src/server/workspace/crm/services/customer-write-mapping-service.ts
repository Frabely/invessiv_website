import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { resolveCustomerContactDisplayName } from "@invessiv/common/patterns/crm/customer-contact-display-name";
import type {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import type {
  ValidatedCreateCustomerInput,
  ValidatedPrimaryContactInput,
  ValidatedUpdateCustomerInput,
} from "@/server/workspace/crm/crm-types";
import type { CustomerWriteFieldsDto } from "@invessiv/common/contracts/crm/customer-write-fields.dto";
import type { VersionedPatch } from "@/server/workspace/shared/update-versioned-types";

function mapWriteFields(fields: CustomerWriteFieldsDto) {
  return {
    display_name: fields.displayName,
    company_name: fields.companyName,
    category_id: fields.categoryId,
    street: fields.street,
    postal_code: fields.postalCode,
    city: fields.city,
    country: fields.country,
    website_url: fields.websiteUrl,
    vat_id: fields.vatId,
    notes: fields.notes,
    default_hourly_rate_cents: fields.defaultHourlyRateCents,
  };
}

function mapCreateCustomerApiToDb(
  customerId: string,
  input: ValidatedCreateCustomerInput,
  ownerMemberId: string,
): typeof customers.$inferInsert {
  return {
    id: customerId,
    ...mapWriteFields(input),
    status: CustomerStatus.Active,
    owner_member_id: ownerMemberId,
    retention_review_after_days: null,
    version: 1,
  };
}

function mapUpdateCustomerApiToDb(
  input: ValidatedUpdateCustomerInput,
): VersionedPatch<typeof customers> {
  return { ...mapWriteFields(input), status: input.status };
}

function mapContactApiToPersonDb(
  personId: string,
  contact: ValidatedPrimaryContactInput,
): typeof people.$inferInsert {
  return {
    id: personId,
    display_name: resolveCustomerContactDisplayName(contact),
    first_name: contact.firstName,
    last_name: contact.lastName,
    primary_email: contact.email,
    primary_phone: contact.phone,
    preferred_locale: contact.preferredLocale,
    notes: null,
    version: 1,
  };
}

function mapContactApiToAssignmentDb(
  assignmentId: string,
  customerId: string,
  personId: string,
  contact: ValidatedPrimaryContactInput,
  isPrimary: boolean,
): typeof customerContactAssignments.$inferInsert {
  return {
    id: assignmentId,
    customer_id: customerId,
    person_id: personId,
    role_label: contact.roleLabel,
    business_email: null,
    business_phone: null,
    is_primary: isPrimary,
    version: 1,
  };
}

export const customerWriteMappingService = {
  mapCreateCustomerApiToDb,
  mapUpdateCustomerApiToDb,
  mapContactApiToPersonDb,
  mapContactApiToAssignmentDb,
} as const;
