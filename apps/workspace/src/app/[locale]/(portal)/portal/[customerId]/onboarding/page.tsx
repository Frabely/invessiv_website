import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { buildPortalOnboardingPath } from "@/common/patterns/portal/portal-onboarding-path";
import { OnboardingOverview } from "@/components/portal/onboarding/onboarding-overview/onboarding-overview";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getPortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor } from "@/lib/auth/routes";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { listPortalOnboardingForms } from "@/server/portal/query-handler/list-portal-onboarding-forms.query-handler";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalOnboardingPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
};

export async function generateMetadata({
  params,
}: PortalOnboardingPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const meta = getPortalOnboardingDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalOnboardingPage({
  params,
}: PortalOnboardingPageProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  // Without the permission the module does not exist for this reader.
  if (
    !portalCanOn.forReader(reader, Permission.PortalOnboardingRead, {
      customerId: reader.customerId,
    })
  )
    notFound();

  const forms = await listPortalOnboardingForms(reader);
  const hrefOf = (formId: string) =>
    buildPortalOnboardingPath({
      locale: activeLocale,
      customerId: reader.customerId,
      formId,
    });
  // The usual case is one project: the list would only be a detour.
  if (forms.length === 1) redirect(hrefOf(forms[0].id));

  return (
    <OnboardingOverview
      content={getPortalOnboardingDictionary(activeLocale)}
      dashboardHref={portalPathFor(activeLocale, reader.customerId)}
      forms={forms.map((form) => ({ form, href: hrefOf(form.id) }))}
    />
  );
}
