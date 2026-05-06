import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, gte, ilike, lte, ne, or } from "drizzle-orm";
import { leads } from "@/server/db/record-configuration";
import { LEAD_LIST_PAGE_SIZE } from "@/common/constants/leads/lead-list-defaults";
import { LeadSort } from "@/common/constants/leads/lead-sort";
import type { LeadFilterInput } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";

export type LeadFilterResult = {
  where: SQL | undefined;
  orderBy: SQL;
  limit: number;
  offset: number;
  page: number;
  perPage: number;
};

export function buildLeadFilter(filter: LeadFilterInput): LeadFilterResult {
  const conditions: (SQL | undefined)[] = [];

  if (filter.status === "archived") {
    conditions.push(eq(leads.lead_status, "archived"));
  } else if (filter.status && filter.status !== "all") {
    conditions.push(eq(leads.lead_status, filter.status));
  } else {
    conditions.push(ne(leads.lead_status, "archived"));
  }

  if (filter.source) {
    conditions.push(eq(leads.source, filter.source));
  }

  if (filter.category) {
    conditions.push(eq(leads.category_id, filter.category));
  }

  if (filter.score_min !== undefined) {
    conditions.push(gte(leads.score, filter.score_min));
  }

  if (filter.date_from) {
    conditions.push(gte(leads.created_at, new Date(filter.date_from)));
  }

  if (filter.date_to) {
    conditions.push(lte(leads.created_at, new Date(filter.date_to)));
  }

  if (filter.search) {
    const term = `%${filter.search}%`;
    conditions.push(
      or(
        ilike(leads.email, term),
        ilike(leads.first_name, term),
        ilike(leads.last_name, term),
        ilike(leads.company_name, term),
        ilike(leads.owner, term),
      ),
    );
  }

  const page = filter.page ?? 1;
  const perPage = LEAD_LIST_PAGE_SIZE;

  return {
    where: and(...conditions),
    orderBy: buildOrderBy(filter.sort),
    limit: perPage,
    offset: (page - 1) * perPage,
    page,
    perPage,
  };
}

function buildOrderBy(sort?: LeadSort): SQL {
  switch (sort) {
    case LeadSort.CreatedAsc:
      return asc(leads.created_at);
    case LeadSort.UpdatedAsc:
      return asc(leads.updated_at);
    case LeadSort.UpdatedDesc:
      return desc(leads.updated_at);
    case LeadSort.ScoreAsc:
      return asc(leads.score);
    case LeadSort.ScoreDesc:
      return desc(leads.score);
    case LeadSort.NameAsc:
      return asc(leads.last_name);
    case LeadSort.NameDesc:
      return desc(leads.last_name);
    case LeadSort.CreatedDesc:
    default:
      return desc(leads.created_at);
  }
}
