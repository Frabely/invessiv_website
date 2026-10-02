import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import { OnboardingFormView } from "@/components/portal/onboarding/onboarding-form-view/onboarding-form-view";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getPortalFilesDictionary,
  getPortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { crmOnboardingFormPathFor, portalPathFor } from "@/lib/auth/routes";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalOnboardingBooking } from "@/server/portal/query-handler/get-portal-onboarding-booking.query-handler";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalOnboardingFormPageProps = {
  params: Promise<{ locale: string; customerId: string; formId: string }>;
};

export async function generateMetadata({
  params,
}: PortalOnboardingFormPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  // Metadata runs outside the page's access check, so it never names the project.
  const meta = getPortalOnboardingDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalOnboardingFormPage({
  params,
}: PortalOnboardingFormPageProps) {
  const { locale, customerId, formId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  // A draft, a foreign form and a missing permission all answer like an unknown id.
  const form = await getPortalOnboardingForm(
    reader,
    formId.toLowerCase(),
    activeLocale,
  );
  if (!form) notFound();
  const isOwnerView = isPortalOwnerView(reader);
  const target = { customerId: reader.customerId };
  // Null before the submission, after the completion and when nobody offers a link.
  const booking = await getPortalOnboardingBooking(reader, form.id);

  return (
    <OnboardingFormView
      backHref={portalPathFor(activeLocale, reader.customerId)}
      booking={booking}
      canUpload={
        !isOwnerView &&
        portalCanOn.forReader(reader, Permission.PortalFilesWrite, target)
      }
      chatHref={
        portalCanOn.forReader(reader, Permission.PortalMessagesRead, target)
          ? portalPathFor(
              activeLocale,
              reader.customerId,
              PortalSection.Messages,
            )
          : null
      }
      cockpitHref={
        isOwnerView ? crmOnboardingFormPathFor(activeLocale, form.id) : null
      }
      content={getPortalOnboardingDictionary(activeLocale)}
      customerId={reader.customerId}
      filesContent={getPortalFilesDictionary(activeLocale)}
      form={form}
      key={reader.customerId}
      locale={activeLocale}
    />
  );
}
