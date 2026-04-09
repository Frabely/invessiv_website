import "server-only";
import { projectRequestSchema } from "@/features/contact/contact.schema";
import type { ProjectRequestSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/contact/handlers/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/handlers/validate-command-payload";
import { submitContactInquiry } from "@/server/services/contact/submit-contact-inquiry";

export async function submitProjectRequestCommandHandler(
  payload: ProjectRequestSubmitRequest,
  requestId: string,
): Promise<ContactCommandHandlerResult> {
  return validateCommandPayload(
    projectRequestSchema,
    payload,
    (validatedPayload) => submitContactInquiry(validatedPayload, requestId),
  );
}
