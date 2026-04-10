import { DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES } from "@/features/contact/client/base-contact-fields";

export type ProjectRequestFormValues = {
  budgetKey: string;
  company: string;
  consentAccepted: boolean;
  email: string;
  firstName: string;
  lastName: string;
  goalKey: string;
  offerKey: string;
  customPageNames: string[];
  pageKeys: string[];
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
  customPageNames: [],
  pageKeys: [],
  phone: "",
  preferredStartKey: "",
  projectDetails: "",
  role: "",
  website: "",
  websiteTrap: "",
  workflowKey: "",
};
