"use client";

import { useRef } from "react";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LinkedInPostExampleContent } from "@/i18n/dictionaries/linkedin-post/example";
import { SampleCard } from "./sample-card/sample-card";
import styles from "./example-section.module.css";

type ExampleSectionProps = LinkedInPostExampleContent & {
  id: string;
  locale: Locale;
  generatorHref: string;
};

export function ExampleSection({
  id,
  locale,
  eyebrow,
  title,
  body,
  inputLabel,
  inputShowLabel,
  inputHideLabel,
  outputLabel,
  samplesAriaLabel,
  topicFieldLabel,
  roleFieldLabel,
  toneFieldLabel,
  captionMore,
  captionLess,
  maximizeLabel,
  lightboxCloseLabel,
  lightboxAriaLabel,
  disclaimer,
  samples,
  ctaLead,
  ctaLabel,
  ctaAriaLabel,
  generatorHref,
}: ExampleSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <header className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
      </header>

      <ul
        aria-label={samplesAriaLabel}
        className={styles.samplesGrid}
        role="list"
        tabIndex={0}
      >
        {samples.map((sample, index) => (
          <li
            className={styles.sampleCardWrap}
            data-position={index === 0 ? "left" : "right"}
            data-reveal-item="true"
            key={sample.id}
          >
            <SampleCard
              captionLess={captionLess}
              captionMore={captionMore}
              disclaimer={disclaimer}
              inputHideLabel={inputHideLabel}
              inputLabel={inputLabel}
              inputShowLabel={inputShowLabel}
              lightboxAriaLabel={lightboxAriaLabel}
              lightboxCloseLabel={lightboxCloseLabel}
              maximizeLabel={maximizeLabel}
              outputLabel={outputLabel}
              roleFieldLabel={roleFieldLabel}
              sample={sample}
              toneFieldLabel={toneFieldLabel}
              topicFieldLabel={topicFieldLabel}
            />
          </li>
        ))}
      </ul>

      <div className={styles.ctaRow} data-reveal-item="true">
        <p className={styles.ctaLead}>{ctaLead}</p>
        <PrimaryCtaLink
          aria-label={ctaAriaLabel}
          className={styles.ctaButton}
          data-analytics-event="cta_click"
          data-analytics-location="example_section"
          data-analytics-target="generator"
          data-analytics-variant="primary"
          href={generatorHref}
        >
          {ctaLabel}
        </PrimaryCtaLink>
      </div>
    </section>
  );
}
