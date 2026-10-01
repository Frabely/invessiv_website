import "server-only";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import { onboardingApiError } from "@/lib/workspace/crm/onboarding-api-error";

/**
 * Success answers carry the DTO without an envelope; a version conflict carries the
 * `VersionConflictDto`, a release that waits for an acknowledgement its warnings as details.
 */
export function onboardingApiResponse<T>(
  result: OnboardingCommandResult<T>,
  successStatus: HttpResponseCode = HttpResponseCode.Ok,
): Response {
  if (result.ok) return Response.json(result.value, { status: successStatus });
  if ("conflict" in result)
    return Response.json(result.conflict, {
      status: HttpResponseCode.Conflict,
    });
  if ("warnings" in result)
    return onboardingApiError(result.code, {
      details: { warnings: result.warnings },
    });
  return onboardingApiError(result.code, {
    details: "errors" in result ? result.errors : undefined,
  });
}
