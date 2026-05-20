"use client";

import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingFaqContent } from "@/i18n/dictionaries/landing/faq";
import styles from "./faq-section.module.css";

type FaqSectionProps = LandingFaqContent & {
  id: string;
  locale: Locale;
};

export function FaqSection({
  cta,
  eyebrow,
  id,
  items,
  locale,
  title,
}: FaqSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={styles.section}
      id={id}
      ref={sectionRef}
    >
      <span aria-hidden="true" className={styles.dotGrid} />
      <div className={styles.heading} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
        </h2>
      </div>

      <ol className={styles.list}>
        {items.map((item) => (
          <li
            className={styles.item}
            data-reveal-item="true"
            key={item.question}
          >
            <details className={styles.details}>
              <summary className={styles.summary}>
                <span className={styles.question}>{item.question}</span>
                <span aria-hidden="true" className={styles.plus}>
                  <span className={styles.plusBar} />
                  <span className={styles.plusBar} />
                </span>
              </summary>
              <div className={styles.answerWrapper}>
                <div className={styles.answerInner}>
                  <p className={styles.answer}>{item.answer}</p>
                  {item.link ? (
                    <a className={styles.answerLink} href={item.link.href}>
                      {item.link.label}
                    </a>
                  ) : null}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>

      {cta ? (
        <p className={styles.ctaLine} data-reveal-item="true">
          <a
            className={styles.ctaLink}
            data-analytics-event="cta_click"
            data-analytics-location="faq"
            data-analytics-target={cta.analyticsTarget}
            data-analytics-variant={cta.analyticsVariant ?? "soft"}
            href={cta.href}
          >
            {cta.label}
          </a>
        </p>
      ) : null}
    </section>
  );
}
