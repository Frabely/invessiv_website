import Image from "next/image";
import reviewProjectImage from "../../../../../../assets/review-project.png";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { ProofReviewCard } from "./proof-review-card/proof-review-card";
import styles from "./proof-section.module.css";

type ProofReview = {
  authorName: string;
  context: string;
  excerpt: string;
  profileImageSrc?: string;
  reviewHref: string;
  sourceLabel: string;
};

type ProofSectionProps = {
  description: string;
  featuredProjectFallbackLabel: string;
  featuredProject?: {
    ariaLabel: string;
    kicker: string;
    title: string;
    description: string;
    meta: string;
  };
  highlightsAriaLabel: string;
  id: string;
  moreProjectsFallbackCtaLabel: string;
  moreProjectsFallbackHref: string;
  moreProjectsFallbackTitle: string;
  moreProjects?: {
    ctaLabel: string;
    description: string;
    href: string;
    title: string;
  };
  ratingAriaLabel: string;
  reviewLinkLabel: string;
  reviews: ProofReview[];
  summaryPoints?: string[];
  title: string;
};

export function ProofSection({
  description,
  featuredProjectFallbackLabel,
  featuredProject,
  highlightsAriaLabel,
  id,
  moreProjectsFallbackCtaLabel,
  moreProjectsFallbackHref,
  moreProjectsFallbackTitle,
  moreProjects,
  ratingAriaLabel,
  reviewLinkLabel,
  reviews,
  summaryPoints,
  title,
}: ProofSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <h2 className={styles.title}>{title}</h2>
          <SectionScanPoints
            ariaLabel={highlightsAriaLabel}
            className={styles.highlights}
            fallbackClassName={styles.description}
            fallbackText={description}
            points={summaryPoints}
          />
        </div>
      </div>

      <div className={styles.grid} role="list">
        <div className={styles.reviewColumn} role="presentation">
          {reviews.map((review) => (
            <ProofReviewCard
              authorName={review.authorName}
              context={review.context}
              excerpt={review.excerpt}
              key={`${review.authorName}-${review.context}`}
              profileImageSrc={review.profileImageSrc}
              ratingAriaLabel={ratingAriaLabel}
              reviewHref={review.reviewHref}
              reviewLinkLabel={reviewLinkLabel}
              sourceLabel={review.sourceLabel}
            />
          ))}
        </div>

        <article
          aria-label={
            featuredProject?.ariaLabel ?? featuredProjectFallbackLabel
          }
          className={`${styles.card} ${styles.placeholderCard}`}
          role="listitem"
        >
          <div className={styles.websiteFrame}>
            <div className={styles.websiteChrome} aria-hidden="true">
              <span className={styles.chromeDot} />
              <span className={styles.chromeDot} />
              <span className={styles.chromeDot} />
              <div className={styles.chromeBar} />
            </div>
            <div className={styles.websiteViewport}>
              <Image
                alt=""
                className={styles.placeholderImage}
                height={1400}
                priority={false}
                src={reviewProjectImage}
                width={1400}
              />
            </div>
          </div>
          <div className={styles.placeholderContent}>
            <p className={styles.placeholderKicker}>
              {featuredProject?.kicker ?? featuredProjectFallbackLabel}
            </p>
            <h3 className={styles.placeholderTitle}>
              {featuredProject?.title ?? ""}
            </h3>
            <p className={styles.placeholderText}>
              {featuredProject?.description ?? ""}
            </p>
            <p className={styles.placeholderMeta}>
              {featuredProject?.meta ?? ""}
            </p>
          </div>
        </article>
      </div>

      <div className={styles.sectionFooter}>
        <div className={styles.footerTransitionCopy}>
          <p className={styles.footerTransitionKicker}>
            {moreProjects?.title ?? moreProjectsFallbackTitle}
          </p>
          <p className={styles.footerTransitionText}>
            {moreProjects?.description ?? ""}
          </p>
        </div>
        <a
          className={styles.footerTransitionLink}
          href={moreProjects?.href ?? moreProjectsFallbackHref}
        >
          <span className={styles.footerTransitionLinkLabel}>
            {moreProjects?.ctaLabel ?? moreProjectsFallbackCtaLabel}
          </span>
        </a>
      </div>
    </section>
  );
}
