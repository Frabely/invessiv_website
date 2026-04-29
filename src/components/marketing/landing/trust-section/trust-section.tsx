"use client";

import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingTrustContent } from "@/i18n/dictionaries/landing/trust";
import styles from "./trust-section.module.css";

type TrustSectionProps = LandingTrustContent & {
  id: string;
  locale: Locale;
};

export function TrustSection({
  body,
  eyebrow,
  id,
  items,
  itemsLabel,
  locale,
  reassurance,
  title,
}: TrustSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <article className={styles.card}>
        <div className={styles.body}>
          <header className={styles.header} data-reveal-item="true">
            <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.statement}>{body}</p>
          </header>

          <ul className={styles.signals} aria-label={itemsLabel}>
            {items.map((item) => (
              <li className={styles.signal} data-reveal-item="true" key={item}>
                <span aria-hidden="true" className={styles.signalIcon}>
                  <svg
                    fill="none"
                    height="14"
                    viewBox="0 0 24 24"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12.5l4.2 4 9.3-9.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.6"
                    />
                  </svg>
                </span>
                <span className={styles.signalText}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.signature} data-reveal-item="true">
          <span aria-hidden="true" className={styles.signatureMarker} />
          <span>{reassurance}</span>
        </p>
      </article>
    </section>
  );
}
