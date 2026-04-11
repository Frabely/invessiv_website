import type { BaseContactFieldsValues } from "@/common/contracts/contact/fields/base-contact-fields-values";

export type DiscoveryCallFormValues = BaseContactFieldsValues & {
  consentAccepted: boolean;
};
