import "server-only";

import type { PortalOnboardingBookingDto } from "@invessiv/common/contracts/portal/portal-onboarding-booking.dto";
import { isOnboardingCallBookable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalOnboardingMappingService } from "@/server/portal/services/onboarding/portal-onboarding-mapping-service";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";

/**
 * Where the reader books the onboarding call of one form. The project comes from the form the
 * portal shows to this reader, never from the request, so a foreign or guessed form yields
 * nothing. `null` also means: not submitted yet, already completed, or nobody who answers for the
 * project offers a link — the portal then shows that the team will get in touch.
 */
export async function getPortalOnboardingBooking(
  reader: PortalReader,
  formId: string,
): Promise<PortalOnboardingBookingDto | null> {
  if (!portalOnboardingService.canRead(reader)) return null;
  const db = getDrizzleDatabaseClient();
  const visible = await portalOnboardingService.findVisibleForm(
    db,
    reader,
    formId,
  );
  if (!visible || !isOnboardingCallBookable(visible.form.status)) return null;
  const contact = await projectResponsibleMemberService.findBookingContact(
    db,
    visible.form.project_id,
  );
  return contact ? portalOnboardingMappingService.toBookingDto(contact) : null;
}
