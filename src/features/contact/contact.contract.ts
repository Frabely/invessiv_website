import type { Locale } from "@/config/i18n";
import type { ContactRequestKind } from "@/features/contact/contact-request-kind";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactOfferKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@/features/contact/contact-options";

export type ProjectRequestSubmitRequest = {
  budgetKey?: ContactBudgetKey;
  company?: string;
  consentAccepted: boolean;
  email: string;
  firstName: string;
  goalKey?: ContactGoalKey;
  kind: Extract<ContactRequestKind, "project_request">;
  lastName: string;
  locale: Locale;
  offerKey: ContactOfferKey;
  customPageNames?: string[];
  pageKeys?: ContactPageKey[];
  phone?: string;
  preferredStartKey?: ContactStartKey;
  projectDetails: string;
  role?: string;
  startedAt: string;
  website?: string;
  websiteTrap?: string;
  workflowKey?: ContactWorkflowKey;
};

export type QuickContactSubmitRequest = {
  consentAccepted: boolean;
  email: string;
  firstName: string;
  kind: Extract<ContactRequestKind, "quick_contact">;
  lastName: string;
  locale: Locale;
  message: string;
};

export type ContactSubmitErrorCode =
  | "delivery_unavailable"
  | "internal_error"
  | "invalid_json"
  | "method_not_allowed"
  | "payload_too_large"
  | "rate_limited"
  | "spam_detected"
  | "validation_error";

export type ContactSubmitSuccessResponse = {
  ok: true;
  requestId: string;
};

export type ContactSubmitErrorResponse = {
  code: ContactSubmitErrorCode;
  fieldErrors?: Record<string, string[]>;
  ok: false;
  requestId: string;
};

export type ContactSubmitResponse =
  | ContactSubmitSuccessResponse
  | ContactSubmitErrorResponse;
