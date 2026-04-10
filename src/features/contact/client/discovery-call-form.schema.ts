import {
  DEFAULT_BASE_CONTACT_FIELDS_VALUES,
  type BaseContactFieldsValues,
} from "@/features/contact/client/base-contact-fields";

export type DiscoveryCallFormValues = BaseContactFieldsValues & {
  consentAccepted: boolean;
};

export const DEFAULT_DISCOVERY_CALL_FORM_VALUES: DiscoveryCallFormValues = {
  ...DEFAULT_BASE_CONTACT_FIELDS_VALUES,
  consentAccepted: false,
};
