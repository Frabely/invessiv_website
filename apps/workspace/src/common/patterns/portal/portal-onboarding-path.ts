import { PortalOnboardingQueryParam } from "@/common/constants/portal/portal-onboarding-query-params";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import type { PortalOnboardingStepTarget } from "@/common/contracts/portal/portal-onboarding-step-target";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";

/**
 * The query of one step of a form: the block (or the review step) and, after a jump from the list
 * of missing answers, the field to focus. Empty for the first step.
 */
export function buildPortalOnboardingStepSearch({
  section,
  fieldId,
}: PortalOnboardingStepTarget): string {
  const params = new URLSearchParams();
  if (section) params.set(PortalOnboardingQueryParam.Section, section);
  if (section && fieldId) params.set(PortalOnboardingQueryParam.Field, fieldId);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * The onboarding overview of a company, or one of its forms. Overview, redirects and jump links go
 * through here, so the URL shape exists once.
 */
export function buildPortalOnboardingPath({
  locale,
  customerId,
  formId,
  step = {},
}: {
  locale: Locale;
  customerId: string;
  formId?: string;
  step?: PortalOnboardingStepTarget;
}): string {
  const overview = [
    createLocalePathname(SITE_ROUTES.PORTAL, locale),
    encodeURIComponent(customerId),
    PortalSection.Onboarding,
  ].join("/");
  if (!formId) return overview;
  return `${overview}/${encodeURIComponent(formId)}${buildPortalOnboardingStepSearch(step)}`;
}
