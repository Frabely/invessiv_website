import type { OnboardingCatalogStatus } from "../../../constants/crm/onboarding/onboarding-catalog-statuses";
import type { Locale } from "@invessiv/common";
import type { OnboardingBlockTranslationDto } from "./onboarding-block-translation.dto";
import type { OnboardingFieldDto } from "./onboarding-field.dto";

/** A building block: a catalog entry or the snapshot copy owned by exactly one form. */
export interface OnboardingBlockDto {
  /** Block id; a copy has its own id, never the catalog block's. */
  id: string;
  /** Internal key such as `company_profile`; unique among catalog blocks, copies keep it. */
  key: string;
  /** Company-wide content that a follow-up project pre-fills from the last completed form. */
  carryOver: boolean;
  /** Only catalog blocks are ever archived; blocks of a form are always active. */
  status: OnboardingCatalogStatus;
  /** Catalog block this copy was taken from; matches blocks across forms for the pre-fill. Null for catalog blocks or once the origin was deleted. */
  sourceBlockId: string | null;
  /** Texts per maintained locale; at least one exists. */
  translations: Partial<Record<Locale, OnboardingBlockTranslationDto>>;
  /** Block-level fields in display order; group sub-fields sit in `children`. */
  fields: OnboardingFieldDto[];
  /** Optimistic-concurrency counter of the block row. */
  version: number;
}
