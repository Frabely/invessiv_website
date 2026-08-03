import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";

export interface MarkLeadContactedSuccess {
  ok: true;
  leadStatus: ContactLeadStatus;
  changed: boolean;
}

export interface MarkLeadContactedFailure {
  ok: false;
  code: LeadErrorCode;
}

export type MarkLeadContactedResult =
  MarkLeadContactedSuccess | MarkLeadContactedFailure;
