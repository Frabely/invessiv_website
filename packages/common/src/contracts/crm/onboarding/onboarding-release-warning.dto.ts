import type { OnboardingReleaseWarningKind } from "../../../constants/crm/onboarding/onboarding-release-warning-kinds";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/** One reason to pause before a release; the team may acknowledge it and release anyway. */
export type OnboardingReleaseWarningDto =
  | {
      /** A block lacks texts in the language of a contact who will fill the form. */
      kind: typeof OnboardingReleaseWarningKind.MissingTranslation;
      /** Block whose title, a field or an option has no text in `locale`. */
      blockId: string;
      /** Preferred language of at least one active portal contact of the customer. */
      locale: Locale;
    }
  | {
      /** The customer has no active portal contact yet, so nobody could open the form. */
      kind: typeof OnboardingReleaseWarningKind.NoPortalAccess;
    };
