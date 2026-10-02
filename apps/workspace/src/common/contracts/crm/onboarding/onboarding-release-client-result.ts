import type { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingReleaseWarningDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-release-warning.dto";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";

/**
 * A release answers with the released form, with the warnings it waits for, with the current form
 * of a version conflict, or with a plain code.
 */
export type OnboardingReleaseClientResult =
  | { ok: true; value: OnboardingFormDto }
  | {
      ok: false;
      code: typeof OnboardingErrorCode.ReleaseWarnings;
      warnings: OnboardingReleaseWarningDto[];
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: OnboardingFormDto;
    }
  | {
      ok: false;
      code: Exclude<
        OnboardingFormClientErrorCode,
        typeof OnboardingErrorCode.ReleaseWarnings
      >;
    };
