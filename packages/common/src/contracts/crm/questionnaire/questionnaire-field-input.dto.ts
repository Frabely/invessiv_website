import type { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnairePrefillSource } from "../../../constants/crm/questionnaire/questionnaire-prefill-sources";
import type { AssetKind } from "../../../constants/files/asset-kind";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { QuestionnaireChoiceInputDto } from "./questionnaire-choice-input.dto";
import type { QuestionnaireFieldTranslationDto } from "./questionnaire-field-translation.dto";

/** Everything of a field that the editor may change; the type is fixed once the field exists. */
export interface QuestionnaireFieldInputDto {
  /** Internal key, unique within the block including group sub-fields. */
  key: string;
  /** Required only counts while the field is visible. */
  requirement: QuestionnaireFieldRequirement;
  /** Only for short and long text; null uses the type default. */
  maxLength: number | null;
  /** Only for files, groups and multi choice. */
  minItems: number | null;
  /** Only for files, groups and multi choice; null means the global limit. */
  maxItems: number | null;
  /** Only for files; null accepts every uploadable kind. */
  acceptedAssetKinds: AssetKind[] | null;
  /** Only for the one type that fits the source (`QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES`). */
  prefillSource: QuestionnairePrefillSource | null;
  /** Trigger on the same level with a lower position; null means always visible. */
  conditionFieldId: string | null;
  /** Option of the trigger; set together with `conditionFieldId`. */
  conditionChoiceId: string | null;
  /** Replaces every stored locale; at least one must remain. */
  translations: Partial<Record<Locale, QuestionnaireFieldTranslationDto>>;
  /** Replaces the options, matched by key; empty for types without options. */
  choices: QuestionnaireChoiceInputDto[];
}
