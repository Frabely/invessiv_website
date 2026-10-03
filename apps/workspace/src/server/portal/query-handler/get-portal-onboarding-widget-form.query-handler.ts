import "server-only";

import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";

/** Reads only the released form of the selected project for the dashboard widget. */
export async function getPortalOnboardingWidgetForm(
  reader: PortalReader,
  projectId: string,
): Promise<PortalOnboardingFormSummaryDto | null> {
  if (!portalOnboardingService.canRead(reader)) return null;
  const db = getDrizzleDatabaseClient();
  const visible = await portalOnboardingService.findVisibleFormForProject(
    db,
    reader,
    projectId,
  );
  return visible
    ? portalOnboardingService.toSummaryDto(db, reader, visible)
    : null;
}
