import type { BaseContactFieldsValues } from "@/common/contracts/contact/fields/base-contact-fields-values";
import { DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES } from "@/common/defaults/contact/contact-identity-fields-values";

export const DEFAULT_BASE_CONTACT_FIELDS_VALUES: BaseContactFieldsValues = {
  ...DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES,
  message: "",
};
