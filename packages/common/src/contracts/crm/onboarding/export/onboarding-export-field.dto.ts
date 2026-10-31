import type { QuestionnaireFieldType } from "../../../../constants/crm/questionnaire/questionnaire-field-types";
import type { AssetKind } from "../../../../constants/files/asset-kind";
import type { OnboardingExportAnswer } from "./onboarding-export-answer";
import type { OnboardingExportConditionDto } from "./onboarding-export-condition.dto";

/** One question with its answer; present whether or not the customer answered it. */
export interface OnboardingExportFieldDto {
  /** Stable key, unique within the block (or the group); the same across forms, unlike the label. */
  key: string;
  /** Field type; decides the shape of `answer`. */
  type: QuestionnaireFieldType;
  /** Question in the export locale. */
  label: string;
  /** Explanation the customer reads below the question; null when there is none. */
  help: string | null;
  /** Whether the question must be answered while it is visible. */
  required: boolean;
  /**
   * Whether the customer sees the question with the answers given so far. A hidden question is
   * exported anyway so nothing about the form's content is lost.
   */
  visible: boolean;
  /** Answer of another question that shows this one; null when it is always shown. */
  condition: OnboardingExportConditionDto | null;
  /** Length cap of a text answer; null when the type default applies or the type has none. */
  maxLength: number | null;
  /** Minimum number of files, entries or options; null when there is none. */
  minItems: number | null;
  /** Maximum number of files, entries or options; null when only the global limit applies. */
  maxItems: number | null;
  /** File kinds a files question accepts; null when it accepts every kind or is no files question. */
  acceptedAssetKinds: AssetKind[] | null;
  /** Whether the answer holds anything at all, whatever the question requires. */
  answered: boolean;
  /** The answer; its `kind` follows from `type`. */
  answer: OnboardingExportAnswer;
}
