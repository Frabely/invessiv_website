import { QuestionnaireFieldType } from "./questionnaire-field-types";

/** CRM values a field is pre-filled with. Nothing is ever written back from the form into the CRM. */
export const QuestionnairePrefillSource = {
  CustomerCompanyName: "customer_company_name",
  CustomerAddress: "customer_address",
  CustomerVatId: "customer_vat_id",
  CustomerWebsiteUrl: "customer_website_url",
  PrimaryContactName: "primary_contact_name",
  PrimaryContactEmail: "primary_contact_email",
  PrimaryContactPhone: "primary_contact_phone",
} as const;

export type QuestionnairePrefillSource =
  (typeof QuestionnairePrefillSource)[keyof typeof QuestionnairePrefillSource];

export const QUESTIONNAIRE_PREFILL_SOURCE_VALUES = [
  QuestionnairePrefillSource.CustomerCompanyName,
  QuestionnairePrefillSource.CustomerAddress,
  QuestionnairePrefillSource.CustomerVatId,
  QuestionnairePrefillSource.CustomerWebsiteUrl,
  QuestionnairePrefillSource.PrimaryContactName,
  QuestionnairePrefillSource.PrimaryContactEmail,
  QuestionnairePrefillSource.PrimaryContactPhone,
] as const;

/** The one field type each source fits; the field editor offers a source only for that type. */
export const QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES = {
  [QuestionnairePrefillSource.CustomerCompanyName]:
    QuestionnaireFieldType.ShortText,
  [QuestionnairePrefillSource.CustomerAddress]: QuestionnaireFieldType.LongText,
  [QuestionnairePrefillSource.CustomerVatId]: QuestionnaireFieldType.ShortText,
  [QuestionnairePrefillSource.CustomerWebsiteUrl]: QuestionnaireFieldType.Url,
  [QuestionnairePrefillSource.PrimaryContactName]:
    QuestionnaireFieldType.ShortText,
  [QuestionnairePrefillSource.PrimaryContactEmail]:
    QuestionnaireFieldType.Email,
  [QuestionnairePrefillSource.PrimaryContactPhone]:
    QuestionnaireFieldType.Phone,
} as const satisfies Record<QuestionnairePrefillSource, QuestionnaireFieldType>;
