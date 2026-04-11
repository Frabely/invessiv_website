import type { DiscoveryCallFormValues } from "@/common/contracts/contact/forms/discovery-call-form-values";
import { DEFAULT_BASE_CONTACT_FIELDS_VALUES } from "@/common/defaults/contact/base-contact-fields-values";

export const DEFAULT_DISCOVERY_CALL_FORM_VALUES: DiscoveryCallFormValues = {
  ...DEFAULT_BASE_CONTACT_FIELDS_VALUES,
  consentAccepted: false,
};
