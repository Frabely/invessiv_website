import "server-only";
import { randomUUID } from "node:crypto";
import type { Locale } from "@/config/i18n";
import type {
  DiscoveryCallSubmitInput,
  ProjectRequestSubmitInput,
  QuickContactSubmitInput,
} from "@/features/contact/contact.schema";
import type { ContactSubmissionChannel } from "@/features/contact/contact-request-kind";
import {
  CONTACT_LEAD_STORAGE,
  type ContactLeadStatus,
} from "@/server/config/contact-lead-storage";

const DEFAULT_LEAD_STATUS: ContactLeadStatus =
  CONTACT_LEAD_STORAGE.defaultLeadStatus;

type TimestampedRecord = {
  createdAt: Date;
  updatedAt: Date;
};

type LeadIdentity = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
};

type PreparedLeadRecord = TimestampedRecord &
  LeadIdentity & {
    leadStatus: ContactLeadStatus;
  };

type PreparedLeadSubmissionRecord = TimestampedRecord & {
  channel: ContactSubmissionChannel;
  consentAcceptedAt: Date;
  id: string;
  locale: Locale;
  requestId: string;
  submissionStartedAt?: Date;
};

type PreparedProjectRequestRecord = TimestampedRecord & {
  offerKey: ProjectRequestSubmitInput["offerKey"];
  budgetKey?: ProjectRequestSubmitInput["budgetKey"];
  company?: string;
  customPageNames?: string[];
  goalKey?: ProjectRequestSubmitInput["goalKey"];
  id: string;
  leadSubmissionId: string;
  pageKeys?: ProjectRequestSubmitInput["pageKeys"];
  phone?: string;
  preferredStartKey?: ProjectRequestSubmitInput["preferredStartKey"];
  projectDetails: string;
  role?: string;
  website?: string;
  workflowKey?: ProjectRequestSubmitInput["workflowKey"];
};

type PreparedEmailContactRecord = TimestampedRecord & {
  id: string;
  leadSubmissionId: string;
  message: string;
};

type PreparedCallContactRecord = TimestampedRecord & {
  id: string;
  leadSubmissionId: string;
  message?: string;
};

type LeadRecordInput = {
  email: string;
  firstName: string;
  lastName: string;
};

type SubmissionRecordInput = {
  locale: Locale;
  startedAt?: Date;
};

export type PreparedProjectRequestLeadWrite = {
  lead: PreparedLeadRecord;
  projectRequest: PreparedProjectRequestRecord;
  submission: PreparedLeadSubmissionRecord;
};

export type PreparedQuickContactLeadWrite = {
  emailContact: PreparedEmailContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};

export type PreparedDiscoveryCallLeadWrite = {
  callContact: PreparedCallContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};

function createLeadRecord(
  payload: LeadRecordInput,
  createdAt: Date,
): PreparedLeadRecord {
  return {
    createdAt,
    email: payload.email.trim(),
    firstName: payload.firstName.trim(),
    id: randomUUID(),
    lastName: payload.lastName.trim(),
    leadStatus: DEFAULT_LEAD_STATUS,
    updatedAt: createdAt,
  };
}

function createSubmissionRecord(
  payload: SubmissionRecordInput,
  requestId: string,
  channel: ContactSubmissionChannel,
  createdAt: Date,
): PreparedLeadSubmissionRecord {
  return {
    channel,
    consentAcceptedAt: createdAt,
    createdAt,
    id: randomUUID(),
    locale: payload.locale,
    requestId,
    submissionStartedAt: payload.startedAt,
    updatedAt: createdAt,
  };
}

export function createProjectRequestLeadWrite(
  payload: ProjectRequestSubmitInput,
  requestId: string,
  createdAt = new Date(),
): PreparedProjectRequestLeadWrite {
  const lead = createLeadRecord(payload, createdAt);
  const submission = createSubmissionRecord(
    {
      locale: payload.locale,
      startedAt: new Date(payload.startedAt),
    },
    requestId,
    "project_request",
    createdAt,
  );

  return {
    lead,
    projectRequest: {
      offerKey: payload.offerKey,
      budgetKey: payload.budgetKey,
      company: payload.company,
      createdAt: submission.createdAt,
      customPageNames: payload.customPageNames?.length
        ? payload.customPageNames
        : undefined,
      goalKey: payload.goalKey,
      id: randomUUID(),
      leadSubmissionId: submission.id,
      pageKeys: payload.pageKeys?.length ? payload.pageKeys : undefined,
      phone: payload.phone,
      preferredStartKey: payload.preferredStartKey,
      projectDetails: payload.projectDetails.trim(),
      role: payload.role,
      updatedAt: submission.updatedAt,
      website: payload.website,
      workflowKey: payload.workflowKey,
    },
    submission,
  };
}

export function createQuickContactLeadWrite(
  payload: QuickContactSubmitInput,
  requestId: string,
  createdAt = new Date(),
): PreparedQuickContactLeadWrite {
  const lead = createLeadRecord(payload, createdAt);
  const submission = createSubmissionRecord(
    { locale: payload.locale },
    requestId,
    "quick_contact",
    createdAt,
  );

  return {
    emailContact: {
      createdAt: submission.createdAt,
      id: randomUUID(),
      leadSubmissionId: submission.id,
      message: payload.message.trim(),
      updatedAt: submission.updatedAt,
    },
    lead,
    submission,
  };
}

export function createDiscoveryCallLeadWrite(
  payload: DiscoveryCallSubmitInput,
  requestId: string,
  createdAt = new Date(),
): PreparedDiscoveryCallLeadWrite {
  const lead = createLeadRecord(payload, createdAt);
  const submission = createSubmissionRecord(
    { locale: payload.locale },
    requestId,
    "discovery_call",
    createdAt,
  );
  const message = payload.message?.trim();

  return {
    callContact: {
      createdAt: submission.createdAt,
      id: randomUUID(),
      leadSubmissionId: submission.id,
      message: message || undefined,
      updatedAt: submission.updatedAt,
    },
    lead,
    submission,
  };
}
