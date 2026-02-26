import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { LegalLanguageSwitch } from "@/components/legal/legal-language-switch/legal-language-switch";

type LegalSlug = "imprint" | "privacy" | "terms";

type LegalLayoutProps = {
  children: ReactNode;
  lead: string;
  locale: Locale;
  slug: LegalSlug;
  title: string;
};

export function LegalLayout({ children, lead, locale, slug, title }: LegalLayoutProps) {
  return (
    <main className="legal-page">
      <div className="legal-page__topbar">
        <Link className="btn btn--ghost legal-page__back" href={`/${locale}`}>
          {locale === "de" ? "Zur Startseite" : "Back to home"}
        </Link>
        <LegalLanguageSwitch locale={locale} slug={slug} />
      </div>
      <h1>{title}</h1>
      <p className="legal-lead">{lead}</p>
      {children}
    </main>
  );
}
