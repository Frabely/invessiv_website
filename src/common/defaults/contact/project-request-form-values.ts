import type { ProjectRequestFormValues } from "@/common/contracts/contact/forms/project-request-form-values";
import { DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES } from "@/common/defaults/contact/contact-identity-fields-values";

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
