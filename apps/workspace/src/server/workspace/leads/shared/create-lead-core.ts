import "server-only";

import { desc, eq } from "drizzle-orm";

import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { CreateLeadCoreInput } from "@invessiv/common/contracts/leads/create-lead-core-input";
import type { CreateLeadCoreOptions } from "@invessiv/common/contracts/leads/create-lead-core-options";
import type { CreateActivityInput } from "@invessiv/common/contracts/activity/create-activity-input";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import type { LeadDetailMainRow } from "@invessiv/common/contracts/leads/rows/lead-detail-main-row";
import type { LeadSocialProfileRow } from "@invessiv/common/contracts/leads/rows/lead-social-profile-row";
import type { LeadSubmissionRow } from "@invessiv/common/contracts/leads/rows/lead-submission-row";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  activities,
  leadCategories,
  leads,
  leadSocialProfiles,
  leadSubmissions,
  users,
} from "@invessiv/db/record-configuration";
import { activityService } from "@/server/shared/services/activity-service";
import { leadsMapperService } from "@/server/workspace/leads/services/leads-mapper-service";
import { deriveLeadDisplayName } from "@/server/workspace/leads/shared/lead-display-name";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/shared/lead-url-normalization-service";
import {
  isDuplicateCompanyNameError,
  isDuplicateEmailError,
  isDuplicateSocialProfileError,
} from "@/server/workspace/leads/shared/is-duplicate-email-error";

import { DuplicateCompanyNameError } from "./duplicate-company-name-error.class";
import { DuplicateEmailError } from "./duplicate-email-error.class";
import { DuplicateSocialProfileError } from "./duplicate-social-profile-error.class";

async function loadLeadDetailInTransaction(
  tx: ContactDatabaseTransaction,
  leadId: string,
): Promise<LeadDetailDto> {
  const [leadRows, socialProfiles, activityRows, submissions] =
    await Promise.all([
      tx
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
        .where(eq(leads.id, leadId))
        .limit(1),
      tx
        .select({
          id: leadSocialProfiles.id,
          platform: leadSocialProfiles.platform,
          profile_url: leadSocialProfiles.profile_url,
          normalized_url: leadSocialProfiles.normalized_url,
        })
        .from(leadSocialProfiles)
        .where(eq(leadSocialProfiles.lead_id, leadId)),
      tx
        .select({
          id: activities.id,
          type: activities.type,
          title: activities.title,
          body: activities.body,
          metadata: activities.metadata,
          occurred_at: activities.occurred_at,
          actor_type: activities.actor_type,
          actor_id: activities.actor_id,
          actor_label: activities.actor_label,
          actor_user_id: activities.actor_user_id,
          actor_display_name: users.display_name,
        })
        .from(activities)
        .leftJoin(users, eq(users.id, activities.actor_user_id))
        .where(eq(activities.lead_id, leadId))
        .orderBy(desc(activities.occurred_at), desc(activities.id)),
      tx
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
        .where(eq(leadSubmissions.lead_id, leadId))
        .orderBy(desc(leadSubmissions.created_at)),
    ]);

  const leadRow = leadRows[0];
  if (!leadRow) {
    throw new Error(`Created lead ${leadId} not found after insert`);
  }

  return leadsMapperService.mapLeadDetailRowToDto(
    leadRow as LeadDetailMainRow,
    socialProfiles as LeadSocialProfileRow[],
    activityRows,
    submissions as LeadSubmissionRow[],
  );
}

export async function createLeadCoreInTransaction(
  tx: ContactDatabaseTransaction,
  input: CreateLeadCoreInput,
  options: CreateLeadCoreOptions,
): Promise<LeadDetailDto> {
  const now = new Date();
  const leadId = crypto.randomUUID();
  const owner = options.ownerOverride ?? input.owner ?? null;
  const leadStatus = options.statusOverride ?? ContactLeadStatus.New;
  const displayName =
    input.displayName.trim() ||
    deriveLeadDisplayName({
      company_name: input.company_name,
      first_name: input.first_name,
      last_name: input.last_name,
    }) ||
    "";

  try {
    await tx.insert(leads).values({
      id: leadId,
      display_name: displayName,
      first_name: input.first_name ?? null,
      last_name: input.last_name ?? null,
      company_name: input.company_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      website_url: input.website_url ?? null,
      category_id: input.category_id ?? null,
      score: input.score ?? null,
      source: options.source,
      lead_status: leadStatus,
      owner,
      notes: input.notes ?? null,
      improvements: input.improvements ?? null,
      external_guid: options.externalGuid ?? null,
      created_at: now,
      updated_at: now,
    });

    if (input.social_profiles?.length) {
      await tx.insert(leadSocialProfiles).values(
        input.social_profiles.map((profile) => ({
          id: crypto.randomUUID(),
          lead_id: leadId,
          platform: profile.platform,
          profile_url: profile.profile_url,
          normalized_url: normalizeLeadProfileUrl(profile.profile_url),
          created_at: now,
          updated_at: now,
        })),
      );
    }

    const activityInput: CreateActivityInput = {
      leadId,
      type: options.activityType,
      actor: { type: ActorType.User, userId: options.actorUserId },
      metadata: options.activityMetadata ?? null,
    };
    await activityService.createActivity(tx, activityInput);

    return await loadLeadDetailInTransaction(tx, leadId);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw new DuplicateEmailError();
    }

    if (isDuplicateCompanyNameError(error)) {
      throw new DuplicateCompanyNameError();
    }

    if (isDuplicateSocialProfileError(error)) {
      throw new DuplicateSocialProfileError();
    }

    throw error;
  }
}
