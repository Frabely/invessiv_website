import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell/dashboard-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getDashboardMetaContent,
  getDashboardPageContent,
} from "@/i18n/dictionaries/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const content = getDashboardMetaContent(locale as Locale);
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const content = getDashboardPageContent(locale as Locale);
  return <DashboardShell content={content} />;
}
