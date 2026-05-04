import { count, eq } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leadCategories, leads } from "@/server/db/record-configuration";
import type { LeadFilterInput } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { mapLeadRowToSummaryDto } from "@/server/workspace/leads/services/lead-summary/lead-summary-mapping-service";
import type { ListLeadsResult } from "@/common/contracts/leads/results/list-leads-result";
import { buildLeadFilter } from "./lead-filter.query-handler";

export async function listLeads(
  filter: LeadFilterInput,
): Promise<ListLeadsResult> {
  const db = getDrizzleDatabaseClient();
  const { where, orderBy, limit, offset, page, perPage } =
    buildLeadFilter(filter);

  const [countRows, rows] = await Promise.all([
    db.select({ count: count() }).from(leads).where(where),
    db
      .select({
        id: leads.id,
        first_name: leads.first_name,
        last_name: leads.last_name,
        company_name: leads.company_name,
        email: leads.email,
        website_url: leads.website_url,
        score: leads.score,
        source: leads.source,
        lead_status: leads.lead_status,
        owner: leads.owner,
        created_at: leads.created_at,
        updated_at: leads.updated_at,
        category_id: leads.category_id,
        category_slug: leadCategories.slug,
        category_label_key: leadCategories.label_key,
      })
      .from(leads)
      .leftJoin(leadCategories, eq(leads.category_id, leadCategories.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);

  return {
    rows: rows.map(mapLeadRowToSummaryDto),
    total: Number(countRows[0]?.count ?? 0),
    page,
    perPage,
  };
}
