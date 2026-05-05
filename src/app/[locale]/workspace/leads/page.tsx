import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { LeadsPageHeader } from "@/components/workspace/leads/shell/leads-page-header/leads-page-header";
import { LeadsPageShell } from "@/components/workspace/leads/shell/leads-page-shell/leads-page-shell";
import {
  getLeadsMetaDictionary,
  getLeadsShellDictionary,
} from "@/i18n/dictionaries/workspace/leads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeadsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LeadsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getLeadsMetaDictionary(locale as Locale);
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function LeadsPage({ params }: LeadsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const shellContent = getLeadsShellDictionary(locale as Locale);

  return <LeadsPageShell header={<LeadsPageHeader content={shellContent} />} />;
}
