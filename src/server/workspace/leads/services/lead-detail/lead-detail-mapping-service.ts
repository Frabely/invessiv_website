import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { LeadSocialProfileDto } from "@/common/contracts/leads/lead-social-profile.dto";
import type { LeadActivityDto } from "@/common/contracts/leads/lead-activity.dto";
import type { LeadSubmissionDto } from "@/common/contracts/leads/lead-submission.dto";
import type { LeadDetailMainRow } from "@/common/contracts/leads/rows/lead-detail-main-row";
import type { LeadSocialProfileRow } from "@/common/contracts/leads/rows/lead-social-profile-row";
import type { LeadActivityRow } from "@/common/contracts/leads/rows/lead-activity-row";
import type { LeadSubmissionRow } from "@/common/contracts/leads/rows/lead-submission-row";
import { mapCategoryRowToDto } from "@/server/workspace/leads/services/lead-category/lead-category-mapping-service";

function mapSocialProfileRowToDto(
  row: LeadSocialProfileRow,
): LeadSocialProfileDto {
  return {
    id: row.id,
    platform: row.platform,
    profileUrl: row.profile_url,
    normalizedUrl: row.normalized_url,
  };
}

function mapActivityRowToDto(row: LeadActivityRow): LeadActivityDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata,
    occurredAt: row.occurred_at,
    actorType: row.actor_type,
    actorId: row.actor_id,
    actorLabel: row.actor_label,
  };
}

function mapSubmissionRowToDto(row: LeadSubmissionRow): LeadSubmissionDto {
  return {
    id: row.id,
    requestId: row.request_id,
    channel: row.channel,
    locale: row.locale,
    consentAcceptedAt: row.consent_accepted_at,
    submissionStartedAt: row.submission_started_at,
    createdAt: row.created_at,
  };
}

export function mapLeadDetailRowToDto(
  mainRow: LeadDetailMainRow,
  socialProfileRows: LeadSocialProfileRow[],
  activityRows: LeadActivityRow[],
  submissionRows: LeadSubmissionRow[],
): LeadDetailDto {
  return {
    id: mainRow.id,
    firstName: mainRow.first_name,
    lastName: mainRow.last_name,
    companyName: mainRow.company_name,
    email: mainRow.email,
    phone: mainRow.phone,
    websiteUrl: mainRow.website_url,
    score: mainRow.score,
    source: mainRow.source,
    leadStatus: mainRow.lead_status,
    owner: mainRow.owner,
    notes: mainRow.notes,
    improvements: mainRow.improvements,
    externalGuid: mainRow.external_guid,
    createdAt: mainRow.created_at,
    updatedAt: mainRow.updated_at,
    category: mapCategoryRowToDto(mainRow),
    socialProfiles: socialProfileRows.map(mapSocialProfileRowToDto),
    activities: activityRows.map(mapActivityRowToDto),
    submissions: submissionRows.map(mapSubmissionRowToDto),
  };
}
