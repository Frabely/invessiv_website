import "server-only";

import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import { isOnboardingCallBookable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalOnboardingMappingService } from "@/server/portal/services/onboarding/portal-onboarding-mapping-service";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";

/**
 * The onboarding call of one form, as soon as it is due: the team has reviewed every block and
 * has nothing left to send back. The project comes from the form the portal shows to this
 * reader, never from the request. `null` covers a foreign or guessed form as well as a review
 * that is still running, so the portal learns nothing about the review before its end. A due
 * call without `booking` means that nobody who answers for the project offers a link.
 */
export async function getPortalOnboardingCall(
  reader: PortalReader,
  formId: string,
): Promise<PortalOnboardingCallDto | null> {
  if (!portalOnboardingService.canRead(reader)) return null;
  const db = getDrizzleDatabaseClient();
  const visible = await portalOnboardingService.findVisibleForm(
    db,
    reader,
    formId,
  );
  if (!visible) return null;
  const blocks = await portalOnboardingService.loadReviewRefs(
    db,
    visible.form.id,
  );
  if (!isOnboardingCallBookable(visible.form.status, blocks)) return null;
  const contact = await projectResponsibleMemberService.findBookingContact(
    db,
    visible.form.project_id,
  );
  return {
    booking: contact
      ? portalOnboardingMappingService.toBookingDto(contact)
      : null,
  };
}
