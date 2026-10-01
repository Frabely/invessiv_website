import "server-only";

import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";

/** Every released form of the reader's company, newest first; nothing without the permission. */
export async function listPortalOnboardingForms(
  reader: PortalReader,
): Promise<PortalOnboardingFormSummaryDto[]> {
  if (!portalOnboardingService.canRead(reader)) return [];
  const db = getDrizzleDatabaseClient();
  const forms = await portalOnboardingService.listVisibleForms(db, reader);
  return Promise.all(
    forms.map((visible) =>
      portalOnboardingService.toSummaryDto(db, reader, visible),
    ),
  );
}
