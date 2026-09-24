import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PortalCompanyPicker } from "@/components/portal/portal-company-picker/portal-company-picker";
import { FeatureFlag, isFeatureEnabled } from "@/config/feature-flags";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getPortalMetaDictionary,
  getPortalPickerDictionary,
} from "@/i18n/dictionaries/portal";
import {
  portalEntryPathFor,
  portalPathFor,
  signInPathWithRedirect,
} from "@/lib/auth/routes";
import { listPortalMembershipsForUser } from "@/server/portal/query-handler/list-portal-memberships-for-user.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalEntryPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PortalEntryPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const meta = getPortalMetaDictionary(locale as Locale).entry;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

/**
 * The company weiche: no customer is known yet, so this never resolves a `PortalActor` — only
 * the Clerk identity, to list its active memberships.
 */
export default async function PortalEntryPage({
  params,
}: PortalEntryPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale) || !isFeatureEnabled(FeatureFlag.Portal)) {
    notFound();
  }
  const activeLocale = locale as Locale;

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    redirect(
      signInPathWithRedirect(activeLocale, portalEntryPathFor(activeLocale)),
    );
  }

  const memberships = await listPortalMembershipsForUser(clerkUserId);
  const [membership] = memberships;
  if (!membership) {
    notFound();
  }
  if (memberships.length === 1) {
    redirect(portalPathFor(activeLocale, membership.customerId));
  }

  const content = getPortalPickerDictionary(activeLocale);
  return (
    <PortalCompanyPicker
      companies={memberships}
      content={content}
      locale={activeLocale}
    />
  );
}
