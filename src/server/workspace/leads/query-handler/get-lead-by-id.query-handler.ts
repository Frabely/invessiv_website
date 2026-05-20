import { desc, eq } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import {
  leadActivities,
  leadCategories,
  leads,
  leadSocialProfiles,
  leadSubmissions,
} from "@/server/db/record-configuration";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import { leadsMapperService } from "@/server/workspace/leads/services/leads-mapper-service";

export async function getLeadById(id: string): Promise<LeadDetailDto | null> {
  const db = getDrizzleDatabaseClient();

  const [leadRows, socialProfiles, activities, submissions] = await Promise.all(
    [
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
          notes: leads.notes,
          improvements: leads.improvements,
          external_guid: leads.external_guid,
          created_at: leads.created_at,
          updated_at: leads.updated_at,
          category_id: leads.category_id,
          category_slug: leadCategories.slug,
          category_label_key: leadCategories.label_key,
        })
        .from(leads)
        .leftJoin(leadCategories, eq(leads.category_id, leadCategories.id))
        .where(eq(leads.id, id))
        .limit(1),
      db
        .select({
          id: leadSocialProfiles.id,
          platform: leadSocialProfiles.platform,
          profile_url: leadSocialProfiles.profile_url,
          normalized_url: leadSocialProfiles.normalized_url,
        })
        .from(leadSocialProfiles)
        .where(eq(leadSocialProfiles.lead_id, id)),
      db
        .select({
          id: leadActivities.id,
          type: leadActivities.type,
          title: leadActivities.title,
          body: leadActivities.body,
          metadata: leadActivities.metadata,
          occurred_at: leadActivities.occurred_at,
          actor_type: leadActivities.actor_type,
          actor_id: leadActivities.actor_id,
          actor_label: leadActivities.actor_label,
        })
        .from(leadActivities)
        .where(eq(leadActivities.lead_id, id))
        .orderBy(desc(leadActivities.occurred_at)),
      db
        .select({
          id: leadSubmissions.id,
          request_id: leadSubmissions.request_id,
          channel: leadSubmissions.channel,
          locale: leadSubmissions.locale,
          consent_accepted_at: leadSubmissions.consent_accepted_at,
          submission_started_at: leadSubmissions.submission_started_at,
          created_at: leadSubmissions.created_at,
        })
        .from(leadSubmissions)
        .where(eq(leadSubmissions.lead_id, id))
        .orderBy(desc(leadSubmissions.created_at)),
    ],
  );

  const leadRow = leadRows[0];
  if (!leadRow) return null;

  return leadsMapperService.mapLeadDetailRowToDto(
    leadRow,
    socialProfiles,
    activities,
    submissions,
  );
}
