import { DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES } from "@/features/contact/client/base-contact-fields";

export type ProjectRequestFormValues = {
  budgetKey: string;
  company: string;
  consentAccepted: boolean;
  email: string;
  fullName: string;
  goalKey: string;
  offerKey: string;
  pageKeys: string[];
  pagesCustom: string;
  phone: string;
  preferredStartKey: string;
  projectDetails: string;
  role: string;
  website: string;
  websiteTrap: string;
  workflowKey: string;
};

export const DEFAULT_PROJECT_REQUEST_FORM_VALUES: ProjectRequestFormValues = {
  budgetKey: "",
  company: "",
  consentAccepted: false,
  ...DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES,
  goalKey: "",
  offerKey: "",
  pageKeys: [],
  pagesCustom: "",
  phone: "",
  preferredStartKey: "",
  projectDetails: "",
  role: "",
  website: "",
  websiteTrap: "",
  workflowKey: "",
};
