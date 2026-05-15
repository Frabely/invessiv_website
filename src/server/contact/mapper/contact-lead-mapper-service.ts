import "server-only";
import { randomUUID } from "node:crypto";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import type { ContactSubmissionChannel } from "@/common/contracts/contact/keys/contact-request-kind";
import type { SaveDiscoveryCallDto } from "@/common/contracts/contact/discovery-call/save-discovery-call-dto";
import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import type { SaveQuickContactDto } from "@/common/contracts/contact/quick-contact/save-quick-contact-dto";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import type { ContactLeadPersistRecord } from "@/server/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@/server/db/contracts/contact/contact-lead-submission-persist-record";
import type { DiscoveryCallPersistInput } from "@/server/db/contracts/contact/discovery-call-persist-input";
import type { ProjectRequestPersistInput } from "@/server/db/contracts/contact/project-request-persist-input";
import type { QuickContactPersistInput } from "@/server/db/contracts/contact/quick-contact-persist-input";
import type { Locale } from "@/config/i18n";

export type ApiToDbMapperOptions = {
  createdAt?: Date;
  requestId: string;
};

export type LeadMapperInput = {
  company_name?: string | null;
  email: string;
  displayName: string;
  phone?: string | null;
  notes?: string | null;
  website_url?: string | null;
};

export type SubmissionApiToDbMapperInput = {
  locale: Locale;
  startedAt?: Date;
};

export function mapLeadApiToDb(
  payload: LeadMapperInput,
  createdAt: Date,
): ContactLeadPersistRecord {
  return {
    created_at: createdAt,
    display_name: payload.displayName.trim(),
    email: payload.email.trim(),
    id: randomUUID(),
    first_name: null,
    last_name: null,
    company_name: payload.company_name?.trim() || null,
    phone: payload.phone?.trim() || null,
    notes: payload.notes?.trim() || null,
    lead_status: ContactLeadStatus.PendingReview,
    owner: null,
    source: LeadSource.Webform,
    website_url: payload.website_url?.trim() || null,
    updated_at: createdAt,
  };
}

export function mapSubmissionApiToDb(
  payload: SubmissionApiToDbMapperInput,
  requestId: string,
  channel: ContactSubmissionChannel,
  leadId: string,
  createdAt: Date,
): ContactLeadSubmissionPersistRecord {
  return {
    channel,
    consent_accepted_at: createdAt,
    created_at: createdAt,
    id: randomUUID(),
    lead_id: leadId,
    locale: payload.locale,
    request_id: requestId,
    submission_started_at: payload.startedAt,
    updated_at: createdAt,
  };
}

export function mapQuickContactDtoToDbPersistInput(
  payload: SaveQuickContactDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): QuickContactPersistInput {
  const lead = mapLeadApiToDb(
    {
      displayName: payload.displayName,
      email: payload.email,
      notes: payload.message,
    },
    createdAt,
  );
  const leadSubmission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    CONTACT_REQUEST_KIND.QuickContact,
    lead.id,
    createdAt,
  );

  return {
    lead,
    lead_email_contact: {
      created_at: leadSubmission.created_at,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      message: payload.message.trim(),
      updated_at: leadSubmission.updated_at,
    },
    lead_submission: leadSubmission,
  };
}

export function mapProjectRequestDtoToDbPersistInput(
  payload: SaveProjectRequestDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): ProjectRequestPersistInput {
  const lead = mapLeadApiToDb(
    {
      email: payload.email,
      displayName: payload.displayName,
      company_name: payload.company ?? null,
      phone: payload.phone ?? null,
      notes: payload.projectDetails.trim(),
      website_url: payload.website ?? null,
    },
    createdAt,
  );
  const leadSubmission = mapSubmissionApiToDb(
    {
      locale: payload.locale,
      startedAt: new Date(payload.startedAt),
    },
    requestId,
    CONTACT_REQUEST_KIND.ProjectRequest,
    lead.id,
    createdAt,
  );

  return {
    lead,
    lead_project_request: {
      offer_key: payload.offerKey,
      budget_key: payload.budgetKey,
      company: payload.company,
      created_at: leadSubmission.created_at,
      custom_page_names: payload.customPageNames?.length
        ? payload.customPageNames
        : undefined,
      goal_key: payload.goalKey,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      page_keys: payload.pageKeys?.length ? payload.pageKeys : undefined,
      phone: payload.phone,
      preferred_start_key: payload.preferredStartKey,
      project_details: payload.projectDetails.trim(),
      role: payload.role,
      updated_at: leadSubmission.updated_at,
      website: payload.website,
      workflow_key: payload.workflowKey,
    },
    lead_submission: leadSubmission,
  };
}

export function mapDiscoveryCallDtoToDbPersistInput(
  payload: SaveDiscoveryCallDto,
  { createdAt = new Date(), requestId }: ApiToDbMapperOptions,
): DiscoveryCallPersistInput {
  const lead = mapLeadApiToDb(
    {
      displayName: payload.displayName,
      email: payload.email,
      notes: payload.message ?? null,
    },
    createdAt,
  );
  const leadSubmission = mapSubmissionApiToDb(
    { locale: payload.locale },
    requestId,
    CONTACT_REQUEST_KIND.DiscoveryCall,
    lead.id,
    createdAt,
  );
  const message = payload.message?.trim();

  return {
    call_contact: {
      created_at: leadSubmission.created_at,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      message: message || undefined,
      updated_at: leadSubmission.updated_at,
    },
    lead,
    lead_submission: leadSubmission,
  };
}

export const leadMapperService = {
  mapDiscoveryCallDtoToDbPersistInput,
  mapLeadApiToDb,
  mapProjectRequestDtoToDbPersistInput,
  mapQuickContactDtoToDbPersistInput,
  mapSubmissionApiToDb,
};
