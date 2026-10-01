import type { z } from "zod";
import type { OnboardingErrorCode } from "../../../../constants/crm/errors/onboarding-error-codes";
import type { QuestionnaireErrorCode } from "../../../../constants/crm/errors/questionnaire-error-codes";
import type { ConcurrencyErrorCode } from "../../../../constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "../../../concurrency/version-conflict.dto";
import type { OnboardingReleaseWarningDto } from "../onboarding-release-warning.dto";

/**
 * Result of every internal form command. Form commands reuse the questionnaire kit, so its codes
 * pass through unchanged. A conflict carries the current aggregate: the form for block list
 * commands, the block for head and field commands. A release that waits for an acknowledgement
 * names its warnings.
 */
export type OnboardingCommandResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: typeof OnboardingErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code: Exclude<
        OnboardingErrorCode | QuestionnaireErrorCode,
        | typeof OnboardingErrorCode.ValidationError
        | typeof OnboardingErrorCode.Internal
        | typeof OnboardingErrorCode.ReleaseWarnings
      >;
    }
  | {
      ok: false;
      code: typeof OnboardingErrorCode.ReleaseWarnings;
      warnings: OnboardingReleaseWarningDto[];
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<T>;
    };
