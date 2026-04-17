import type { Locale } from "@/config/i18n";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactOfferKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@/common/contracts/contact/keys/contact-option-keys";

export type SaveProjectRequestDto = {
  budgetKey?: ContactBudgetKey;
  company?: string;
  consentAccepted: boolean;
  email: string;
  firstName: string;
  goalKey?: ContactGoalKey;
  kind: typeof CONTACT_REQUEST_KIND.ProjectRequest;
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
