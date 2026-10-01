import type { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireMissingField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-missing-field";

/** Result of every portal onboarding command; a refused submission names what is missing. */
export type PortalOnboardingResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: typeof PortalOnboardingErrorCode.RequiredMissing;
      missing: QuestionnaireMissingField[];
    }
  | {
      ok: false;
      code: Exclude<
        PortalOnboardingErrorCode,
        typeof PortalOnboardingErrorCode.RequiredMissing
      >;
    };
