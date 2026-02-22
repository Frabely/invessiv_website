"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import type { NavigationItem } from "@/config/site";

type SiteHeaderProps = {
  navigation: NavigationItem[];
};

export function SiteHeader({ navigation }: SiteHeaderProps) {
  const { locale, setLocale } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 14);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const labelsByHref: Record<string, string> =
    locale === "de"
      ? {
          "#proof": "Ergebnisse",
          "#services": "Leistungen",
          "#process": "Prozess",
          "#pricing": "Pakete",
          "#contact": "Kontakt",
        }
      : {
          "#proof": "Proof",
          "#services": "Services",
          "#process": "Process",
          "#pricing": "Pricing",
          "#contact": "Contact",
        };

  const ctaLabel = locale === "de" ? "Projekt anfragen" : "Request project";
  const mobileMenuLabel = locale === "de" ? "Menue" : "Menu";
  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <a className="site-header__brand" href="#hero">
          <Image
            src="/brand/icon.svg"
            alt="Invessiv Logo"
            width={26}
            height={26}
            priority
          />
          <span>Invessiv</span>
        </a>

        <nav aria-label="Primary" className="site-header__desktop-nav">
          <ul className="site-header__nav">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{labelsByHref[item.href] ?? item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions" aria-label="Language and primary action">
          <div aria-label="Language switch" className="lang-switch" role="group">
            <button
              className={`lang-switch__option${locale === "de" ? " is-active" : ""}`}
              onClick={() => setLocale("de")}
              type="button"
            >
              DE
            </button>
            <button
              className={`lang-switch__option${locale === "en" ? " is-active" : ""}`}
              onClick={() => setLocale("en")}
              type="button"
            >
              EN
            </button>
          </div>
          <a className="menu-cta" href="#contact">
            {ctaLabel}
          </a>
        </div>

        <details className="site-header__mobile-menu">
          <summary>{mobileMenuLabel}</summary>
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{labelsByHref[item.href] ?? item.label}</a>
              </li>
            ))}
            <li>
              <a className="mobile-menu-cta" href="#contact">
                {ctaLabel}
              </a>
            </li>
          </ul>
        </details>
      </div>
    </header>
  );
}
