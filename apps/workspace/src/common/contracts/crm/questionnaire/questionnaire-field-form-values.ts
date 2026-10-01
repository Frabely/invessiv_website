import type { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { QuestionnaireChoiceFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-choice-form-values";
import type { QuestionnaireFieldFormText } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-text";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/** Everything the field dialog edits; numbers stay text until the request is built. */
export type QuestionnaireFieldFormValues = {
  type: QuestionnaireFieldType;
  key: string;
  keyEdited: boolean;
  requirement: QuestionnaireFieldRequirement;
  texts: Record<Locale, QuestionnaireFieldFormText>;
  maxLength: string;
  minItems: string;
  maxItems: string;
  acceptedAssetKinds: AssetKind[];
  prefillSource: QuestionnairePrefillSource | null;
  conditionFieldId: string | null;
  conditionChoiceId: string | null;
  choices: QuestionnaireChoiceFormValues[];
};
