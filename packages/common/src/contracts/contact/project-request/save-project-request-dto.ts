import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactOfferKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@invessiv/common/contracts/contact/keys/contact-option-keys";

export type SaveProjectRequestDto = {
  budgetKey?: ContactBudgetKey;
  company?: string;
  consentAccepted: boolean;
  email: string;
  displayName: string;
  goalKey?: ContactGoalKey;
  kind: typeof CONTACT_REQUEST_KIND.ProjectRequest;
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
