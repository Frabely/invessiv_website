import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, gte, ilike, lte, ne, or, sql } from "drizzle-orm";
import {
  CONTACT_LEAD_STATUS_ALL,
  ContactLeadStatus,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import { leads, leadSocialProfiles } from "@invessiv/db/record-configuration";
import { LEAD_LIST_PAGE_SIZE } from "@invessiv/common/constants/leads/list/lead-list-defaults";
import {
  LeadProfileType,
  type LeadProfileType as LeadProfileTypeValue,
} from "@/common/constants/leads/profile/lead-profile-types";
import { LeadSort } from "@invessiv/common/constants/leads/list/lead-sort";
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

  if (filter.status === ContactLeadStatus.Archived) {
    conditions.push(eq(leads.lead_status, ContactLeadStatus.Archived));
  } else if (filter.status && filter.status !== CONTACT_LEAD_STATUS_ALL) {
    conditions.push(eq(leads.lead_status, filter.status));
  } else {
    conditions.push(ne(leads.lead_status, ContactLeadStatus.Archived));
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
        ilike(leads.display_name, term),
        ilike(leads.email, term),
        ilike(leads.first_name, term),
        ilike(leads.last_name, term),
        ilike(leads.company_name, term),
        ilike(leads.owner, term),
      ),
    );
  }

  if (filter.profile_include && filter.profile_include.length > 0) {
    conditions.push(
      and(...filter.profile_include.map((type) => profilePresent(type))),
    );
  }

  if (filter.profile_exclude && filter.profile_exclude.length > 0) {
    conditions.push(
      and(...filter.profile_exclude.map((type) => profileAbsent(type))),
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

function leadContactColumn(profileType: LeadProfileTypeValue) {
  if (profileType === LeadProfileType.Website) {
    return leads.website_url;
  }

  if (profileType === LeadProfileType.Phone) {
    return leads.phone;
  }

  return null;
}

function profilePresent(profileType: LeadProfileTypeValue): SQL {
  const column = leadContactColumn(profileType);
  if (column) {
    return sql`(${column} is not null and btrim(${column}) <> '')`;
  }

  return sql`exists (select 1 from
  ${leadSocialProfiles}
  where
  ${leadSocialProfiles.lead_id}
  =
  ${leads.id}
  and
  ${leadSocialProfiles.platform}
  =
  ${profileType}
  )`;
}

function profileAbsent(profileType: LeadProfileTypeValue): SQL {
  const column = leadContactColumn(profileType);
  if (column) {
    return sql`(${column} is null or btrim(${column}) = '')`;
  }

  return sql`not exists (select 1 from
  ${leadSocialProfiles}
  where
  ${leadSocialProfiles.lead_id}
  =
  ${leads.id}
  and
  ${leadSocialProfiles.platform}
  =
  ${profileType}
  )`;
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
      return asc(leads.display_name);
    case LeadSort.NameDesc:
      return desc(leads.display_name);
    case LeadSort.CreatedDesc:
    default:
      return desc(leads.created_at);
  }
}
