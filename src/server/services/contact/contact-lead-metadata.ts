import "server-only";
import { randomUUID } from "node:crypto";
import type {
  DiscoveryCallSubmitInput,
  ProjectRequestSubmitInput,
  QuickContactSubmitInput,
} from "@/features/contact/contact.schema";
import type { ContactSubmissionChannel } from "@/features/contact/contact-request-kind";

const DEFAULT_LEAD_STATUS = "new" as const;

type PreparedLeadRecord = {
  createdAt: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  leadStatus: typeof DEFAULT_LEAD_STATUS;
  updatedAt: string;
};

type PreparedLeadSubmissionRecord = {
  channel: ContactSubmissionChannel;
  consentAcceptedAt: string;
  createdAt: string;
  id: string;
  locale: string;
  requestId: string;
  submissionStartedAt?: string;
  updatedAt: string;
};

export type PreparedProjectRequestLeadWrite = {
  lead: PreparedLeadRecord;
  projectRequest: {
    offerKey: ProjectRequestSubmitInput["offerKey"];
    budgetKey?: ProjectRequestSubmitInput["budgetKey"];
    company?: string;
    createdAt: string;
    customPageNames?: string[];
    goalKey?: ProjectRequestSubmitInput["goalKey"];
    id: string;
    leadSubmissionId: string;
    pageKeys?: ProjectRequestSubmitInput["pageKeys"];
    phone?: string;
    preferredStartKey?: ProjectRequestSubmitInput["preferredStartKey"];
    projectDetails: string;
    role?: string;
    updatedAt: string;
    website?: string;
    workflowKey?: ProjectRequestSubmitInput["workflowKey"];
  };
  submission: PreparedLeadSubmissionRecord;
};

export type PreparedQuickContactLeadWrite = {
  emailContact: {
    createdAt: string;
    id: string;
    leadSubmissionId: string;
    message: string;
    updatedAt: string;
  };
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};

export type PreparedDiscoveryCallLeadWrite = {
  callContact: {
    createdAt: string;
    id: string;
    leadSubmissionId: string;
    message?: string;
    updatedAt: string;
  };
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};

function createLeadRecord(
  payload: {
    email: string;
    firstName: string;
    lastName: string;
  },
  createdAt: Date,
): PreparedLeadRecord {
  const timestamp = createdAt.toISOString();

  return {
    createdAt: timestamp,
    email: payload.email.trim(),
    firstName: payload.firstName.trim(),
    id: randomUUID(),
    lastName: payload.lastName.trim(),
    leadStatus: DEFAULT_LEAD_STATUS,
    updatedAt: timestamp,
  };
}

function createSubmissionRecord(
  payload: {
    locale: string;
    startedAt?: string;
  },
  requestId: string,
  channel: ContactSubmissionChannel,
  createdAt: Date,
): PreparedLeadSubmissionRecord {
  const timestamp = createdAt.toISOString();

  return {
    channel,
    consentAcceptedAt: timestamp,
    createdAt: timestamp,
    id: randomUUID(),
    locale: payload.locale,
    requestId,
    submissionStartedAt: payload.startedAt,
    updatedAt: timestamp,
  };
}

export function createProjectRequestLeadWrite(
  payload: ProjectRequestSubmitInput,
  requestId: string,
  createdAt = new Date(),
): PreparedProjectRequestLeadWrite {
  const lead = createLeadRecord(payload, createdAt);
  const submission = createSubmissionRecord(
    payload,
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
    payload,
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
    payload,
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
