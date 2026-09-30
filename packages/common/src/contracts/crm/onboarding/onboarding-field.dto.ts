import type { OnboardingFieldRequirement } from "../../../constants/crm/onboarding/onboarding-field-requirements";
import type { OnboardingFieldType } from "../../../constants/crm/onboarding/onboarding-field-types";
import type { OnboardingPrefillSource } from "../../../constants/crm/onboarding/onboarding-prefill-sources";
import type { AssetKind } from "../../../constants/files/asset-kind";
import type { Locale } from "@invessiv/common";
import type { OnboardingChoiceDto } from "./onboarding-choice.dto";
import type { OnboardingFieldTranslationDto } from "./onboarding-field-translation.dto";

/** One question of a block; a `group` field carries its sub-fields in `children`. */
export interface OnboardingFieldDto {
  /** Field id; answers, files and conditions reference this value. */
  id: string;
  /** Block the field belongs to; sub-fields share the block of their group. */
  blockId: string;
  /** Group field this sub-field belongs to; null on block level. Groups are one level deep. */
  parentFieldId: string | null;
  /** Stable internal key, unique within the block. */
  key: string;
  /** Display order within the block or the group, starting at 0. */
  position: number;
  /** Decides rendering, validation and where the answer is stored. */
  type: OnboardingFieldType;
  /** Required only counts while the field is visible; hidden fields are never required. */
  requirement: OnboardingFieldRequirement;
  /** Length cap for short and long text; null falls back to the type default in `ONBOARDING_LIMITS`. */
  maxLength: number | null;
  /** Minimum entries of files, groups and multi choice; applies as soon as one entry exists. */
  minItems: number | null;
  /** Maximum entries of files, groups and multi choice; null means the global limit. */
  maxItems: number | null;
  /** Allowed kinds of a files field; null accepts every kind. */
  acceptedAssetKinds: AssetKind[] | null;
  /** CRM value the field is pre-filled with; null when it asks for something new. */
  prefillSource: OnboardingPrefillSource | null;
  /** Trigger field of the visibility condition; null means always visible. */
  conditionFieldId: string | null;
  /** Option of the trigger field that makes this field visible; set together with `conditionFieldId`. */
  conditionChoiceId: string | null;
  /** Texts per maintained locale; at least one exists. */
  translations: Partial<Record<Locale, OnboardingFieldTranslationDto>>;
  /** Options in display order; empty for types without options. */
  choices: OnboardingChoiceDto[];
  /** Sub-fields in display order; empty unless the type is `group`. */
  children: OnboardingFieldDto[];
  /** Optimistic-concurrency counter of the field row. */
  version: number;
}
