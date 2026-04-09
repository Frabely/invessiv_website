import "server-only";
import { quickContactSchema } from "@/features/contact/contact.schema";
import type { QuickContactSubmitRequest } from "@/features/contact/contact.contract";
import type { ContactCommandHandlerResult } from "@/server/contact/handlers/contact-command-handler-result";
import { validateCommandPayload } from "@/server/contact/handlers/validate-command-payload";
import { submitQuickContactInquiry } from "@/server/services/contact/submit-quick-contact-inquiry";

export async function submitQuickContactCommandHandler(
  payload: QuickContactSubmitRequest,
): Promise<ContactCommandHandlerResult> {
  return validateCommandPayload(
    quickContactSchema,
    payload,
    submitQuickContactInquiry,
  );
}
