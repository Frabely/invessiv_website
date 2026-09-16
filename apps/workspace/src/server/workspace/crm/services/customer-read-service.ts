import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { CUSTOMER_ACTIVE_STATUS_VALUES } from "@invessiv/common/constants/crm/customer-statuses";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";
import type { CustomerContactAssignmentRow } from "@invessiv/common/contracts/crm/rows/customer-contact-assignment-row";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import type { CrmDatabaseExecutor } from "@/server/workspace/crm/crm-types";
import { customersMapperService } from "@/server/workspace/crm/services/customers-mapper-service";

const SUMMARY_COLUMNS = {
  id: customers.id,
  customer_number: customers.customer_number,
  customer_type: customers.customer_type,
  display_name: customers.display_name,
  company_name: customers.company_name,
  status: customers.status,
  owner_member_id: customers.owner_member_id,
  category_id: customers.category_id,
  city: customers.city,
  created_at: customers.created_at,
  updated_at: customers.updated_at,
};

const DETAIL_COLUMNS = {
  ...SUMMARY_COLUMNS,
  street: customers.street,
  postal_code: customers.postal_code,
  country: customers.country,
  website_url: customers.website_url,
  vat_id: customers.vat_id,
  notes: customers.notes,
  default_hourly_rate_cents: customers.default_hourly_rate_cents,
  retention_review_after_days: customers.retention_review_after_days,
  version: customers.version,
};

const CONTACT_COLUMNS = {
  id: customerContactAssignments.id,
  person_id: customerContactAssignments.person_id,
  display_name: people.display_name,
  first_name: people.first_name,
  last_name: people.last_name,
  primary_email: people.primary_email,
  primary_phone: people.primary_phone,
  business_email: customerContactAssignments.business_email,
  business_phone: customerContactAssignments.business_phone,
  role_label: customerContactAssignments.role_label,
  is_primary: customerContactAssignments.is_primary,
  preferred_locale: people.preferred_locale,
  assignment_version: customerContactAssignments.version,
  person_version: people.version,
  created_at: customerContactAssignments.created_at,
  updated_at: customerContactAssignments.updated_at,
};

/**
 * Left join on purpose: a customer without a primary contact must surface as the mapper's
 * invariant error instead of silently disappearing from the list.
 */
async function listSummaries(
  executor: CrmDatabaseExecutor,
  limit: number,
): Promise<CustomerSummaryDto[]> {
  const rows = await executor
    .select({ customer: SUMMARY_COLUMNS, contact: CONTACT_COLUMNS })
    .from(customers)
    .leftJoin(
      customerContactAssignments,
      and(
        eq(customerContactAssignments.customer_id, customers.id),
        eq(customerContactAssignments.is_primary, true),
      ),
    )
    .leftJoin(people, eq(people.id, customerContactAssignments.person_id))
    .where(inArray(customers.status, CUSTOMER_ACTIVE_STATUS_VALUES))
    .orderBy(desc(customers.created_at), desc(customers.customer_number))
    .limit(limit);

  // Drizzle types every left-joined column as nullable; a present assignment id means the
  // whole joined row exists.
  return rows.map(({ customer, contact }) =>
    customersMapperService.toSummary(
      customer,
      contact?.id ? [contact as CustomerContactAssignmentRow] : [],
    ),
  );
}

async function findDetailById(
  executor: CrmDatabaseExecutor,
  customerId: string,
): Promise<CustomerDetailDto | null> {
  const [row] = await executor
    .select(DETAIL_COLUMNS)
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!row) {
    return null;
  }

  const contacts = await executor
    .select(CONTACT_COLUMNS)
    .from(customerContactAssignments)
    .innerJoin(people, eq(people.id, customerContactAssignments.person_id))
    .where(eq(customerContactAssignments.customer_id, customerId))
    .orderBy(
      desc(customerContactAssignments.is_primary),
      asc(customerContactAssignments.created_at),
    );

  return customersMapperService.toDetail(row, contacts);
}

export const customerReadService = {
  findDetailById,
  listSummaries,
} as const;
