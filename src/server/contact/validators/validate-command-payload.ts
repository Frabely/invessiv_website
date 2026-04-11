import type { z } from "zod";
import { flattenContactFieldErrors } from "@/features/contact/contact.schema";
import type { ContactCommandHandlerResult } from "@/common/contracts/contact/records/contact-command-handler-result";

export async function validateCommandPayload<TOutput>(
  schema: z.ZodType<TOutput>,
  payload: unknown,
  onValid: (validatedPayload: TOutput) => Promise<ContactCommandHandlerResult>,
): Promise<ContactCommandHandlerResult> {
  const parsedPayload = schema.safeParse(payload);
  if (!parsedPayload.success) {
    const fieldErrors = flattenContactFieldErrors(parsedPayload.error.issues);
    const issueCodes = new Set(Object.values(fieldErrors).flat());

    return {
      code: issueCodes.has("spam_detected")
        ? "spam_detected"
        : "validation_error",
      fieldErrors,
      ok: false,
    };
  }

  return onValid(parsedPayload.data);
}
