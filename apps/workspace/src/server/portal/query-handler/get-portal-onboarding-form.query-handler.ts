import "server-only";

import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";

/**
 * One onboarding form with texts in the reader's locale. `null` covers every miss alike — guessed
 * id, foreign company, draft, hidden project, missing permission — so a probe confirms nothing.
 */
export async function getPortalOnboardingForm(
  reader: PortalReader,
  formId: string,
  locale: Locale,
): Promise<PortalOnboardingFormDto | null> {
  if (!portalOnboardingService.canRead(reader)) return null;
  const db = getDrizzleDatabaseClient();
  const visible = await portalOnboardingService.findVisibleForm(
    db,
    reader,
    formId,
  );
  return visible
    ? portalOnboardingService.toFormDto(db, reader, visible, locale)
    : null;
}
