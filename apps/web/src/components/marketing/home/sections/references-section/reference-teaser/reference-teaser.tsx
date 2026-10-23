import Link from "next/link";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { REFERENCE_SECTION_HREFS } from "@/common/constants/marketing/reference-section-hrefs";
import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import type { ReferenceCaseStudyLabels } from "@/common/contracts/marketing/reference-case-study-labels";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { ReferenceCollage } from "@/components/marketing/shared/reference-collage/reference-collage";
import { ReferenceTestimonial } from "@/components/marketing/shared/reference-testimonial/reference-testimonial";
import styles from "./reference-teaser.module.css";

type ReferenceTeaserProps = {
  isReversed: boolean;
  labels: ReferenceCaseStudyLabels;
  linkLabel: string;
  reference: ReferenceCaseStudyContent;
  referencesHref: string;
};

const COLLAGE_IMAGE_SIZES = "(max-width: 899px) 70vw, 420px";

export function ReferenceTeaser({
  isReversed,
  labels,
  linkLabel,
  reference,
  referencesHref,
}: ReferenceTeaserProps) {
  const projectHref = `${referencesHref}${REFERENCE_SECTION_HREFS[reference.imageKey]}`;
  const referenceOpenedAttributes = analyticsAttributes(
    AnalyticsEventName.ReferenceOpened,
    {
      project: reference.imageKey,
      target: AnalyticsTarget.References,
    },
  );

  return (
    <article className={styles.teaser} data-reversed={isReversed}>
      <div className={styles.intro}>
        <div className={styles.header}>
          <p className={styles.industry}>{reference.industry}</p>
          <h3 className={styles.name}>{reference.clientName}</h3>
        </div>
        <div className={styles.result}>
          <p className={styles.resultLabel}>{labels.result}</p>
          <p className={styles.resultText}>{reference.result}</p>
        </div>
      </div>

      <Link
        aria-hidden="true"
        className={styles.media}
        href={projectHref}
        tabIndex={-1}
        {...referenceOpenedAttributes}
      >
        <ReferenceCollage
          imageKey={reference.imageKey}
          priority={false}
          shots={reference.shots}
          sizes={COLLAGE_IMAGE_SIZES}
        />
      </Link>

      <div className={styles.details}>
        {reference.testimonial ? (
          <ReferenceTestimonial
            authorName={reference.testimonial.authorName}
            avatarAlt={reference.testimonial.avatarAlt}
            avatarKey={reference.testimonial.avatarKey}
            className={styles.testimonial}
            collapseLabel={labels.collapseQuote}
            expandLabel={labels.expandQuote}
            highlight={reference.testimonial.highlight}
            quote={reference.testimonial.quote}
            role={reference.testimonial.role}
          />
        ) : null}

        <Link
          className={styles.link}
          href={projectHref}
          {...referenceOpenedAttributes}
        >
          {linkLabel}
        </Link>
      </div>
    </article>
  );
}
