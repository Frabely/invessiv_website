import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkedInPostPage } from "@/components/marketing/linkedin-post/ai-workflows-page/ai-workflows-page";
import {
  isSupportedLocale,
  type Locale,
  SUPPORTED_LOCALES,
} from "@/config/i18n";

type LinkedInPostRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LinkedInPostRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  // Vollständige Metadata folgt in Task A7
  return {};
}

export default async function LinkedInPostRoute({
  params,
}: LinkedInPostRouteProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;

  return <LinkedInPostPage locale={activeLocale} />;
}
