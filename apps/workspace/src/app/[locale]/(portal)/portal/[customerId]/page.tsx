import type { Metadata } from "next";
import { getPortalMetaDictionary } from "@/i18n/dictionaries/portal";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalCustomerDisplayName } from "@/server/portal/query-handler/get-portal-customer-display-name.query-handler";

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
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const displayName = await getPortalCustomerDisplayName(reader);

  return <h1>{displayName ?? ""}</h1>;
}
