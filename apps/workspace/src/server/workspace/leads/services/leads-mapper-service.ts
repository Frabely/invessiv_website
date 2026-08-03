import type { LeadActivityDto } from "@invessiv/common/contracts/leads/lead-activity.dto";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import type { LeadSocialProfileDto } from "@invessiv/common/contracts/leads/lead-social-profile.dto";
import type { LeadSubmissionDto } from "@invessiv/common/contracts/leads/lead-submission.dto";
import type { LeadDetailMainRow } from "@invessiv/common/contracts/leads/rows/lead-detail-main-row";
import type { LeadSocialProfileRow } from "@invessiv/common/contracts/leads/rows/lead-social-profile-row";
import type { LeadActivityRow } from "@invessiv/common/contracts/leads/rows/lead-activity-row";
import type { LeadSubmissionRow } from "@invessiv/common/contracts/leads/rows/lead-submission-row";
import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";
import type { LeadSummaryRow } from "@invessiv/common/contracts/leads/rows/lead-summary-row";
import type { LeadLatestPitchDto } from "@invessiv/common/contracts/leads/outreach/lead-latest-pitch.dto";
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
    occurredAt: row.occurred_at.toISOString(),
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
    consentAcceptedAt: row.consent_accepted_at.toISOString(),
    submissionStartedAt: row.submission_started_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

function mapLeadRowToSummaryDto(
  row: LeadSummaryRow,
  socialProfiles: LeadSocialProfileDto[] = [],
  latestPitch: LeadLatestPitchDto | null = null,
): LeadSummaryDto {
  return {
    id: row.id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    websiteUrl: row.website_url,
    score: row.score,
    source: row.source,
    leadStatus: row.lead_status,
    owner: row.owner,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    category: mapCategoryRowToDto(row),
    socialProfiles,
    latestPitch,
  };
}

function mapLeadDetailRowToDto(
  mainRow: LeadDetailMainRow,
  socialProfileRows: LeadSocialProfileRow[],
  activityRows: LeadActivityRow[],
  submissionRows: LeadSubmissionRow[],
): LeadDetailDto {
  return {
    id: mainRow.id,
    displayName: mainRow.display_name,
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
    createdAt: mainRow.created_at.toISOString(),
    updatedAt: mainRow.updated_at.toISOString(),
    category: mapCategoryRowToDto(mainRow),
    socialProfiles: socialProfileRows.map(mapSocialProfileRowToDto),
    activities: activityRows.map(mapActivityRowToDto),
    submissions: submissionRows.map(mapSubmissionRowToDto),
  };
}

export const leadsMapperService = {
  mapLeadDetailRowToDto,
  mapLeadRowToSummaryDto,
};
