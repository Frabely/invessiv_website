import { notFound, redirect } from "next/navigation";
import { isSupportedLocale } from "@/config/i18n";

type LegacyLocalizedTermsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LegacyLocalizedTermsPage({
  params,
}: LegacyLocalizedTermsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  redirect(`/${locale}/agb`);
}
