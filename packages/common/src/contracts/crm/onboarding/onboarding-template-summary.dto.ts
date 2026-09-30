import type { OnboardingCatalogStatus } from "../../../constants/crm/onboarding/onboarding-catalog-statuses";

/** A template row in the catalog list, without its block selection. */
export interface OnboardingTemplateSummaryDto {
  /** Template id; opening the editor addresses this value. */
  id: string;
  /** Internal name; not translated. */
  title: string;
  /** Internal note; null when left empty. */
  description: string | null;
  /** Archived templates stay listed but are not offered when starting a form. */
  status: OnboardingCatalogStatus;
  /** Number of selected blocks, counted by the query. */
  blockCount: number;
  /** ISO timestamp of the last change, for sorting the list. */
  updatedAt: string;
}
