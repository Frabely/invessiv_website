import type { ContactValidationResult } from "@/common/contracts/contact/validation/contact-validation-result";
import {
  discoveryCallSchema,
  type DiscoveryCallValidationData,
} from "@/server/contact/validation/discovery-call/discovery-call.schema";
import { createValidationErrorResult } from "@/server/contact/validation/shared/create-validation-error-result";

function validate(
  input: unknown,
): ContactValidationResult<DiscoveryCallValidationData> {
  const parsedPayload = discoveryCallSchema.safeParse(input);
  if (!parsedPayload.success) {
    return createValidationErrorResult(parsedPayload.error.issues);
  }

  return {
    data: parsedPayload.data,
    ok: true,
  };
}

export const discoveryCallValidationService = {
  validate,
};
