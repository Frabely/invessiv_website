import type { Locale } from "@/config/i18n";
import type { ContactRequestKind } from "@/common/contracts/contact/keys/contact-request-kind";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactOfferKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@/common/contracts/contact/keys/contact-option-keys";

export type ProjectRequestDto = {
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
