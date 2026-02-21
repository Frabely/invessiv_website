import { SiteFooter, SiteHeader } from "@/components/layout/site-shell";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { getRequestI18n } from "@/lib/i18n/server";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dictionary } = await getRequestI18n();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <OrganizationJsonLd />
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main>{children}</main>
      <SiteFooter dictionary={dictionary} />
    </div>
  );
}
