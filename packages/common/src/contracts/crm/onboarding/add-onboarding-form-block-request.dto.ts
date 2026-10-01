import type { AddOnboardingCatalogBlockRequestDto } from "./add-onboarding-catalog-block-request.dto";
import type { AddOnboardingOwnBlockRequestDto } from "./add-onboarding-own-block-request.dto";

/** A new last step of a form: copied from the catalog or created empty. */
export type AddOnboardingFormBlockRequestDto =
  AddOnboardingCatalogBlockRequestDto | AddOnboardingOwnBlockRequestDto;
