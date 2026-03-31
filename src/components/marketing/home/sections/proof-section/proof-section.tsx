import Image from "next/image";
import reviewProjectImage from "../../../../../../assets/review-project.png";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { SECTION_HREFS } from "@/config/site";
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
  featuredProject?: {
    ariaLabel: string;
    kicker: string;
    title: string;
    description: string;
    meta: string;
  };
  id: string;
  moreProjects?: {
    title: string;
    description: string;
    ctaLabel: string;
  };
  ratingAriaLabel?: string;
  reviewLinkLabel?: string;
  reviews: ProofReview[];
  summaryPoints?: string[];
  title: string;
};

export function ProofSection({
  description,
  featuredProject,
  id,
  moreProjects,
  ratingAriaLabel = "5 out of 5 stars",
  reviewLinkLabel = "View on Google",
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
            ariaLabel="Proof section highlights"
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
          aria-label={featuredProject?.ariaLabel ?? "Featured project"}
          className={`${styles.card} ${styles.placeholderCard}`}
          role="listitem"
        >
          <div className={styles.placeholderInner}>
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
                {featuredProject?.kicker ?? "Featured project"}
              </p>
              <h3 className={styles.placeholderTitle}>
                {featuredProject?.title ?? ""}
              </h3>
              <p className={styles.placeholderText}>
                {featuredProject?.description ?? ""}
              </p>
              <p className={styles.placeholderMeta}>{featuredProject?.meta ?? ""}</p>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.sectionFooter}>
        <div className={styles.placeholderLead}>
          <p className={styles.placeholderLeadTitle}>
            {moreProjects?.title ?? "More projects"}
          </p>
          <p className={styles.placeholderLeadText}>
            {moreProjects?.description ?? ""}
          </p>
        </div>
        <div className={styles.placeholderActions}>
          <a className={styles.placeholderLink} href={SECTION_HREFS.services}>
            {moreProjects?.ctaLabel ?? "View all projects"}
          </a>
        </div>
      </div>
    </section>
  );
}
