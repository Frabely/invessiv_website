"use client";

import { useRef } from "react";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type {
  LinkedInPostExampleContent,
  LinkedInPostExampleSample,
} from "@/i18n/dictionaries/linkedin-post/example";
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
  samplesAriaLabel,
  samples,
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
      >
        {samples.map((sample, index) => (
          <SampleCard index={index} key={sample.id} sample={sample} />
        ))}
      </ul>

      <div className={styles.ctaRow} data-reveal-item="true">
        <a
          aria-label={ctaAriaLabel}
          className={styles.ctaLink}
          data-analytics-event="cta_click"
          data-analytics-location="example_section"
          data-analytics-target="generator"
          data-analytics-variant="ghost"
          href={generatorHref}
        >
          <span className={styles.ctaArrow} aria-hidden="true">
            ↓
          </span>
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

type SampleCardProps = {
  index: number;
  sample: LinkedInPostExampleSample;
};

function SampleCard({ index, sample }: SampleCardProps) {
  return (
    <li
      className={styles.sampleCardWrap}
      data-position={index === 0 ? "left" : "right"}
      data-reveal-item="true"
    >
      <article aria-label={sample.topicLabel} className={styles.sampleCard}>
        <div className={styles.metaStrip}>
          <span className={styles.metaTone}>{sample.toneLabel}</span>
          <span aria-hidden="true" className={styles.metaDivider} />
          <span className={styles.metaTopic}>{sample.topicLabel}</span>
        </div>

        <figure aria-label={sample.image.headline} className={styles.postImage}>
          <span aria-hidden="true" className={styles.postImageGrid} />
          <span aria-hidden="true" className={styles.postImageGlow} />
          <div className={styles.postImageContent}>
            <p className={styles.postImageMark} aria-hidden="true">
              ⌗ {sample.id.replace("sample-", "0")}
            </p>
            <h3 className={styles.postImageHeadline}>
              {sample.image.headline}
            </h3>
            <p className={styles.postImageFootnote}>{sample.image.footnote}</p>
          </div>
        </figure>

        <header className={styles.author}>
          <span aria-hidden="true" className={styles.authorAvatar}>
            {sample.author.avatarInitials}
          </span>
          <span className={styles.authorMeta}>
            <span className={styles.authorName}>{sample.author.name}</span>
            <span className={styles.authorRole}>{sample.author.role}</span>
          </span>
        </header>

        <p className={styles.caption}>{sample.caption}</p>
      </article>
    </li>
  );
}
