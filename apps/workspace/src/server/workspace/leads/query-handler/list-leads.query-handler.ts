import { count, desc, eq, inArray } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  leadCategories,
  leadOutreachDrafts,
  leads,
  leadSocialProfiles,
} from "@invessiv/db/record-configuration";
import type { LeadSocialProfileDto } from "@invessiv/common/contracts/leads/lead-social-profile.dto";
import type { LeadLatestPitchDto } from "@invessiv/common/contracts/leads/outreach/lead-latest-pitch.dto";
import type { LeadFilterInput } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { leadsMapperService } from "@/server/workspace/leads/services/leads-mapper-service";
import type { ListLeadsResult } from "@invessiv/common/contracts/leads/results/list-leads-result";
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
        display_name: leads.display_name,
        first_name: leads.first_name,
        last_name: leads.last_name,
        company_name: leads.company_name,
        email: leads.email,
        phone: leads.phone,
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

  const leadIds = rows.map((row) => row.id);
  const socialProfileRows = leadIds.length
    ? await db
        .select({
          id: leadSocialProfiles.id,
          lead_id: leadSocialProfiles.lead_id,
          platform: leadSocialProfiles.platform,
          profile_url: leadSocialProfiles.profile_url,
          normalized_url: leadSocialProfiles.normalized_url,
        })
        .from(leadSocialProfiles)
        .where(inArray(leadSocialProfiles.lead_id, leadIds))
    : [];

  const pitchRows = leadIds.length
    ? await db
        .select({
          lead_id: leadOutreachDrafts.lead_id,
          channel: leadOutreachDrafts.channel,
          char_count: leadOutreachDrafts.char_count,
          created_at: leadOutreachDrafts.created_at,
        })
        .from(leadOutreachDrafts)
        .where(inArray(leadOutreachDrafts.lead_id, leadIds))
        .orderBy(desc(leadOutreachDrafts.created_at))
    : [];

  const latestPitchByLead = new Map<string, LeadLatestPitchDto>();
  for (const row of pitchRows) {
    if (latestPitchByLead.has(row.lead_id)) {
      continue;
    }

    latestPitchByLead.set(row.lead_id, {
      channel: row.channel,
      charCount: row.char_count,
      createdAt: row.created_at.toISOString(),
    });
  }

  const socialProfilesByLead = new Map<string, LeadSocialProfileDto[]>();
  for (const row of socialProfileRows) {
    const list = socialProfilesByLead.get(row.lead_id) ?? [];
    list.push({
      id: row.id,
      platform: row.platform,
      profileUrl: row.profile_url,
      normalizedUrl: row.normalized_url,
    });
    socialProfilesByLead.set(row.lead_id, list);
  }

  return {
    rows: rows.map((row) =>
      leadsMapperService.mapLeadRowToSummaryDto(
        row,
        socialProfilesByLead.get(row.id) ?? [],
        latestPitchByLead.get(row.id) ?? null,
      ),
    ),
    total: Number(countRows[0]?.count ?? 0),
    page,
    perPage,
  };
}
