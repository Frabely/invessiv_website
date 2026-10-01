import type { z } from "zod";
import type { QuestionnaireErrorCode } from "../../../../constants/crm/errors/questionnaire-error-codes";
import type { ConcurrencyErrorCode } from "../../../../constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "../../../concurrency/version-conflict.dto";

/**
 * Result of every questionnaire catalog command. A conflict carries the current aggregate (the block
 * for block and field writes, the template for template writes), so an editor keeps its input.
 */
export type QuestionnaireCommandResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: typeof QuestionnaireErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code: Exclude<
        QuestionnaireErrorCode,
        | typeof QuestionnaireErrorCode.ValidationError
        | typeof QuestionnaireErrorCode.Internal
      >;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<T>;
    };
