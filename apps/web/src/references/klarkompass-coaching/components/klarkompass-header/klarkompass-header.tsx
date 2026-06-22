"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import logoMark from "@/references/klarkompass-coaching/assets/klarkompass-logo-mark.png";
import { KlarkompassCta } from "@/references/klarkompass-coaching/components/klarkompass-cta/klarkompass-cta";
import styles from "./klarkompass-header.module.css";

type KlarkompassNavItem = {
  href: string;
  label: string;
};

type KlarkompassHeaderProps = {
  brand: string;
  ctaHref: string;
  ctaLabel: string;
  homeHref: string;
  menuCloseLabel: string;
  menuOpenLabel: string;
  mockLabel: string;
  navItems: KlarkompassNavItem[];
};

export function KlarkompassHeader({
  brand,
  ctaHref,
  ctaLabel,
  homeHref,
  menuCloseLabel,
  menuOpenLabel,
  mockLabel,
  navItems,
}: KlarkompassHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={styles.header} data-scrolled={isScrolled}>
      <div className={styles.inner}>
        <a className={styles.brand} href={homeHref}>
          <span className={styles.brandMark} aria-hidden="true">
            <Image
              alt=""
              className={styles.brandMarkImg}
              height={32}
              src={logoMark}
              width={32}
            />
          </span>
          {brand}
        </a>

        <nav aria-label={brand} className={styles.nav}>
          {navItems.map((item) => (
            <a
              className={styles.navLink}
              href={`#${item.href}`}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <KlarkompassCta
            className={styles.headerCta}
            href={ctaHref}
            label={ctaLabel}
            mockLabel={mockLabel}
          />
          <button
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? menuCloseLabel : menuOpenLabel}
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            <span className={styles.menuBar} data-open={isMenuOpen} />
            <span className={styles.menuBar} data-open={isMenuOpen} />
            <span className={styles.menuBar} data-open={isMenuOpen} />
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className={styles.mobileMenu}>
          {navItems.map((item) => (
            <a
              className={styles.mobileLink}
              href={`#${item.href}`}
              key={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <KlarkompassCta
            className={styles.mobileCta}
            href={ctaHref}
            label={ctaLabel}
            mockLabel={mockLabel}
            onClick={() => setIsMenuOpen(false)}
          />
        </div>
      ) : null}
    </header>
  );
}
