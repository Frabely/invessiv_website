import "server-only";
import { randomUUID } from "node:crypto";
import type { ContactSubmitInput } from "@/features/contact/contact.schema";
import {
  CONTACT_LEAD_STORAGE,
  LEGAL_DOCUMENT_VERSIONS,
  type ContactLeadMailStatus,
  type ContactLeadStatus,
} from "@/server/config/contact-lead-storage";

export type PreparedContactLeadSubmission = {
  lead: {
    company?: string;
    consentAcceptedAt: string;
    createdAt: string;
    email: string;
    fullName: string;
    id: string;
    inquiryType: ContactSubmitInput["offerKey"];
    leadStatus: ContactLeadStatus;
    locale: ContactSubmitInput["locale"];
    mailProvider: string;
    mailStatus: ContactLeadMailStatus;
    message: string;
    phone?: string;
    privacyVersion: string;
    requestId: string;
    retentionUntil: string;
    role?: string;
    sourceForm: string;
    submissionStartedAt: string;
    termsVersion: string;
    updatedAt: string;
  };
  projectRequest: {
    budgetKey?: ContactSubmitInput["budgetKey"];
    createdAt: string;
    goalKey?: ContactSubmitInput["goalKey"];
    leadId: string;
    pageKeys?: ContactSubmitInput["pageKeys"];
    pagesCustom?: string;
    preferredStartKey?: ContactSubmitInput["preferredStartKey"];
    updatedAt: string;
    website?: string;
    workflowKey?: ContactSubmitInput["workflowKey"];
  };
};

export function calculateLeadRetentionUntil(createdAt: Date) {
  const retentionUntil = new Date(createdAt);
  retentionUntil.setUTCMonth(
    retentionUntil.getUTCMonth() + CONTACT_LEAD_STORAGE.retentionMonths,
  );

  return retentionUntil;
}

export function createContactLeadSubmission(
  payload: ContactSubmitInput,
  requestId: string,
  createdAt = new Date(),
): PreparedContactLeadSubmission {
  const leadId = randomUUID();
  const submittedAt = createdAt.toISOString();

  return {
    lead: {
      company: payload.company,
      consentAcceptedAt: submittedAt,
      createdAt: submittedAt,
      email: payload.email,
      fullName: payload.fullName,
      id: leadId,
      inquiryType: payload.offerKey,
      leadStatus: CONTACT_LEAD_STORAGE.defaultLeadStatus,
      locale: payload.locale,
      mailProvider: CONTACT_LEAD_STORAGE.defaultMailProvider,
      mailStatus: CONTACT_LEAD_STORAGE.defaultMailStatus,
      message: payload.projectDetails,
      phone: payload.phone,
      privacyVersion: LEGAL_DOCUMENT_VERSIONS.privacy,
      requestId,
      retentionUntil: calculateLeadRetentionUntil(createdAt).toISOString(),
      role: payload.role,
      sourceForm: CONTACT_LEAD_STORAGE.sourceForm,
      submissionStartedAt: payload.startedAt,
      termsVersion: LEGAL_DOCUMENT_VERSIONS.terms,
      updatedAt: submittedAt,
    },
    projectRequest: {
      budgetKey: payload.budgetKey,
      createdAt: submittedAt,
      goalKey: payload.goalKey,
      leadId,
      pageKeys: payload.pageKeys?.length ? payload.pageKeys : undefined,
      pagesCustom: payload.pagesCustom,
      preferredStartKey: payload.preferredStartKey,
      updatedAt: submittedAt,
      website: payload.website,
      workflowKey: payload.workflowKey,
    },
  };
}
