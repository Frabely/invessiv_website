import type { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { AssetKind } from "../../../constants/files/asset-kind";
import type { QuestionnaireResolvedChoice } from "./questionnaire-resolved-choice";

/**
 * One question with its texts resolved for a reader: no internal keys, versions or pre-fill
 * sources. It keeps everything `getQuestionnaireCompleteness` reads.
 */
export interface QuestionnaireResolvedField {
  /** Field id; answers and conditions reference this value. */
  id: string;
  /** Block the field belongs to; sub-fields share the block of their group. */
  blockId: string;
  /** Group field this sub-field belongs to; null on block level. */
  parentFieldId: string | null;
  /** Display order within the block or the group, starting at 0. */
  position: number;
  /** Decides rendering, validation and where the answer is stored. */
  type: QuestionnaireFieldType;
  /** Required only counts while the field is visible. */
  requirement: QuestionnaireFieldRequirement;
  /** Length cap for short and long text; null falls back to the type default. */
  maxLength: number | null;
  /** Minimum entries of files, groups and multi choice; applies as soon as one entry exists. */
  minItems: number | null;
  /** Maximum entries of files, groups and multi choice; null means the global limit. */
  maxItems: number | null;
  /** Allowed kinds of a files field; null accepts every kind. */
  acceptedAssetKinds: AssetKind[] | null;
  /** Trigger field of the visibility condition; null means always visible. */
  conditionFieldId: string | null;
  /** Option of the trigger field that makes this field visible. */
  conditionChoiceId: string | null;
  /** Question in the requested locale, or in the first maintained one. */
  label: string;
  /** Explanation below the label; null when the field needs none. */
  help: string | null;
  /** Options in display order; empty for types without options. */
  choices: QuestionnaireResolvedChoice[];
  /** Sub-fields in display order; empty unless the type is `group`. */
  children: QuestionnaireResolvedField[];
}
