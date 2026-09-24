import type { Metadata } from "next";
import { getPortalMetaDictionary } from "@/i18n/dictionaries/portal";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { requirePortalActor } from "@/server/portal/auth/require-portal-actor";
import { listPortalMembershipsForUserId } from "@/server/portal/query-handler/list-portal-memberships-for-user-id.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalCustomerPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
};

export async function generateMetadata({
  params,
}: PortalCustomerPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const meta = getPortalMetaDictionary(locale).company;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

/** A placeholder landing page; Ordner 13 replaces this with the first real portal module. */
export default async function PortalCustomerPage({
  params,
}: PortalCustomerPageProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  const actor = await requirePortalActor(
    activeLocale,
    customerId.toLowerCase(),
  );
  const companies = await listPortalMembershipsForUserId(actor.userId);
  const activeCompany = companies.find(
    (company) => company.customerId === actor.customerId,
  );

  return <h1>{activeCompany?.displayName ?? ""}</h1>;
}
