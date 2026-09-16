import "server-only";

import { and, asc, count, desc, eq, ne } from "drizzle-orm";

import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { CustomerSort } from "@invessiv/common/constants/crm/list/customer-sort";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { CustomerSummaryDto } from "@invessiv/common/contracts/crm/customer-summary.dto";
import type { CustomerContactAssignmentRow } from "@invessiv/common/contracts/crm/rows/customer-contact-assignment-row";
import {
  customerContactAssignments,
  customers,
  people,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import type { CrmDatabaseExecutor } from "@/server/workspace/crm/crm-types";
import { customersMapperService } from "@/server/workspace/crm/services/customers-mapper-service";

const SUMMARY_COLUMNS = {
  id: customers.id,
  customer_number: customers.customer_number,
  display_name: customers.display_name,
  company_name: customers.company_name,
  status: customers.status,
  owner_member_id: customers.owner_member_id,
  owner_display_name: users.display_name,
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

function getListCondition(includeArchived: boolean) {
  return includeArchived
    ? undefined
    : ne(customers.status, CustomerStatus.Archived);
}

function getListOrder(sort: CustomerSort) {
  switch (sort) {
    case CustomerSort.NumberAsc:
      return [asc(customers.customer_number), asc(customers.id)] as const;
    case CustomerSort.NumberDesc:
      return [desc(customers.customer_number), desc(customers.id)] as const;
    case CustomerSort.NameAsc:
      return [asc(customers.display_name), asc(customers.id)] as const;
    case CustomerSort.NameDesc:
      return [desc(customers.display_name), desc(customers.id)] as const;
    case CustomerSort.StatusAsc:
      return [asc(customers.status), asc(customers.id)] as const;
    case CustomerSort.StatusDesc:
      return [desc(customers.status), desc(customers.id)] as const;
    case CustomerSort.UpdatedAsc:
      return [asc(customers.updated_at), asc(customers.id)] as const;
    case CustomerSort.UpdatedDesc:
      return [desc(customers.updated_at), desc(customers.id)] as const;
  }
}

async function countSummaries(
  executor: CrmDatabaseExecutor,
  includeArchived: boolean,
): Promise<number> {
  const [row] = await executor
    .select({ total: count() })
    .from(customers)
    .where(getListCondition(includeArchived));

  return row?.total ?? 0;
}

async function listSummaries(
  executor: CrmDatabaseExecutor,
  filters: CustomerListFilters,
  limit: number,
): Promise<CustomerSummaryDto[]> {
  // Left join on purpose: a customer without a primary contact must surface as the mapper's
  // invariant error instead of silently disappearing from the list.
  const rows = await executor
    .select({ customer: SUMMARY_COLUMNS, contact: CONTACT_COLUMNS })
    .from(customers)
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.id, customers.owner_member_id),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .leftJoin(
      customerContactAssignments,
      and(
        eq(customerContactAssignments.customer_id, customers.id),
        eq(customerContactAssignments.is_primary, true),
      ),
    )
    .leftJoin(people, eq(people.id, customerContactAssignments.person_id))
    .where(getListCondition(filters.includeArchived))
    .orderBy(...getListOrder(filters.sort))
    .offset((filters.page - 1) * limit)
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
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.id, customers.owner_member_id),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
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

async function findStatusById(
  executor: CrmDatabaseExecutor,
  customerId: string,
) {
  const [row] = await executor
    .select({ status: customers.status })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  return row?.status ?? null;
}

export const customerReadService = {
  countSummaries,
  findDetailById,
  findStatusById,
  listSummaries,
} as const;
