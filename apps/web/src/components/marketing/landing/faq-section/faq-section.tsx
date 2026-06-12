"use client";

import { useEffect, useRef, useState } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingFaqContent } from "@/i18n/dictionaries/landing/faq";
import styles from "./faq-section.module.css";

const INITIAL_VISIBLE_ITEMS = 5;

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
  showLessLabel,
  showMoreLabel,
  title,
}: FaqSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const firstExpandedSummaryRef = useRef<HTMLElement | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);
  useStaggeredSectionReveal(sectionRef, locale);

  const hasExpandableItems = items.length > INITIAL_VISIBLE_ITEMS;

  useEffect(() => {
    if (!showAllItems) {
      return;
    }

    firstExpandedSummaryRef.current?.focus();
  }, [showAllItems]);

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

      <ol className={styles.list} id={`${id}-list`}>
        {items.map((item, index) => (
          <li
            className={styles.item}
            data-reveal-item="true"
            hidden={!showAllItems && index >= INITIAL_VISIBLE_ITEMS}
            key={item.question}
          >
            <details className={styles.details}>
              <summary
                className={styles.summary}
                ref={
                  index === INITIAL_VISIBLE_ITEMS
                    ? firstExpandedSummaryRef
                    : undefined
                }
              >
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

      {showAllItems && cta ? (
        <p
          className={styles.ctaLine}
          data-reveal-item="true"
          data-visible="true"
        >
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

      {hasExpandableItems ? (
        <div className={styles.showMoreWrap} data-reveal-item="true">
          <button
            aria-controls={`${id}-list`}
            aria-expanded={showAllItems}
            className={styles.showMore}
            onClick={() => setShowAllItems((currentValue) => !currentValue)}
            type="button"
          >
            {showAllItems ? showLessLabel : showMoreLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}
