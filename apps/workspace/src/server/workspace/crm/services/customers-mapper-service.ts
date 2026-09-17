import type { CustomerContactAssignmentDto } from "@invessiv/common/contracts/crm/customer-contact.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";
import type { CustomerContactAssignmentRow } from "@invessiv/common/contracts/crm/rows/customer-contact-assignment-row";
import type { CustomerDetailRow } from "@invessiv/common/contracts/crm/rows/customer-detail-row";
import type { CustomerSummaryRow } from "@invessiv/common/contracts/crm/rows/customer-summary-row";
import { MissingPrimaryContactError } from "@/server/workspace/crm/services/missing-primary-contact-error.class";

function toContact(
  row: CustomerContactAssignmentRow,
): CustomerContactAssignmentDto {
  return {
    id: row.id,
    personId: row.person_id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    businessEmail: row.business_email,
    businessPhone: row.business_phone,
    roleLabel: row.role_label,
    isPrimary: row.is_primary,
    preferredLocale: row.preferred_locale,
    assignmentVersion: row.assignment_version,
    personVersion: row.person_version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function findPrimaryContact(
  customerId: string,
  contacts: CustomerContactAssignmentRow[],
): CustomerContactAssignmentRow {
  const primary = contacts.find((contact) => contact.is_primary);

  if (!primary) {
    throw new MissingPrimaryContactError(customerId);
  }

  return primary;
}

/** The business address wins when set; otherwise the personal one. */
function resolveContactEmail(row: CustomerContactAssignmentRow): string | null {
  return row.business_email ?? row.primary_email;
}

function toSummary(
  row: CustomerSummaryRow,
  contacts: CustomerContactAssignmentRow[],
): CustomerSummaryDto {
  const primary = findPrimaryContact(row.id, contacts);

  return {
    id: row.id,
    customerNumber: row.customer_number,
    displayName: row.display_name,
    companyName: row.company_name,
    status: row.status,
    ownerMemberId: row.owner_member_id,
    ownerDisplayName: row.owner_display_name,
    categoryId: row.category_id,
    city: row.city,
    primaryContactName: primary.display_name,
    primaryContactEmail: resolveContactEmail(primary),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toDetail(
  row: CustomerDetailRow,
  contacts: CustomerContactAssignmentRow[],
): CustomerDetailDto {
  return {
    ...toSummary(row, contacts),
    street: row.street,
    postalCode: row.postal_code,
    country: row.country,
    websiteUrl: row.website_url,
    vatId: row.vat_id,
    notes: row.notes,
    defaultHourlyRateCents: row.default_hourly_rate_cents,
    retentionReviewAfterDays: row.retention_review_after_days,
    version: row.version,
    contacts: contacts.map(toContact),
  };
}

export const customersMapperService = {
  toSummary,
  toDetail,
  toContact,
} as const;
