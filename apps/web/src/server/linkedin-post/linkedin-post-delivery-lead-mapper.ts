import "server-only";
import { randomUUID } from "node:crypto";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import type { LinkedInPostDeliveryPersistInput } from "@invessiv/db/contracts/contact/linkedin-post-delivery-persist-input";
import { leadMapperService } from "@/server/contact/mapper/contact-lead-mapper-service";
import type { Locale } from "@/config/i18n";

export type LinkedInPostDeliveryMapperInput = {
  displayName: string;
  email: string;
  locale: Locale;
  marketingConsent: boolean;
  contextMessage: string;
  requestId: string;
};

/**
 * Maps the verified deliver request to the Contact-pipeline persistence shape.
 * Reuses the shared lead/submission mappers; the submission is tagged with the
 * `linkedin_post_delivery` channel, `linkedin_post` origin and the marketing
 * consent flag. The email-contact record carries the topic context.
 */
export function mapLinkedInPostDeliveryToDbPersistInput(
  input: LinkedInPostDeliveryMapperInput,
  createdAt: Date = new Date(),
): LinkedInPostDeliveryPersistInput {
  const lead = leadMapperService.mapLeadApiToDb(
    {
      displayName: input.displayName,
      email: input.email,
      notes: input.contextMessage,
    },
    createdAt,
  );
  const leadSubmission = leadMapperService.mapSubmissionApiToDb(
    { locale: input.locale },
    input.requestId,
    CONTACT_REQUEST_KIND.LinkedInPostDelivery,
    lead.id,
    createdAt,
    {
      marketingConsent: input.marketingConsent,
      origin: ContactSubmissionOrigin.LinkedInPost,
    },
  );

  return {
    lead,
    lead_email_contact: {
      created_at: leadSubmission.created_at,
      id: randomUUID(),
      lead_submission_id: leadSubmission.id,
      message: input.contextMessage,
      updated_at: leadSubmission.updated_at,
    },
    lead_submission: leadSubmission,
  };
}
