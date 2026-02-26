import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";

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
        <Link className="legal-page__back" href={`/${locale}`}>
          {locale === "de" ? "Zur Startseite" : "Back to home"}
        </Link>
        <nav aria-label={locale === "de" ? "Sprache wechseln" : "Switch language"} className="legal-lang-switch">
          <Link
            className={`legal-lang-switch__link${locale === "de" ? " is-active" : ""}`}
            href={`/de/${slug}`}
            hrefLang="de"
            lang="de"
          >
            DE
          </Link>
          <Link
            className={`legal-lang-switch__link${locale === "en" ? " is-active" : ""}`}
            href={`/en/${slug}`}
            hrefLang="en"
            lang="en"
          >
            EN
          </Link>
        </nav>
      </div>
      <h1>{title}</h1>
      <p className="legal-lead">{lead}</p>
      {children}
    </main>
  );
}
