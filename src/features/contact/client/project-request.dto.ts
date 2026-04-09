import type { Locale } from "@/config/i18n";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactOfferKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@/features/contact/contact-options";

export type ProjectRequestDto = {
  budgetKey?: ContactBudgetKey;
  company?: string;
  consentAccepted: boolean;
  email: string;
  fullName: string;
  goalKey?: ContactGoalKey;
  locale: Locale;
  offerKey: ContactOfferKey;
  pageKeys?: ContactPageKey[];
  pagesCustom?: string;
  phone?: string;
  preferredStartKey?: ContactStartKey;
  projectDetails: string;
  role?: string;
  startedAt: string;
  website?: string;
  websiteTrap?: string;
  workflowKey?: ContactWorkflowKey;
};
