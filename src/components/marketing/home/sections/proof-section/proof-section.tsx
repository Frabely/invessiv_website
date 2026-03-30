import Image from "next/image";
import { ProofPreviewExperience } from "./proof-preview-experience/proof-preview-experience";
import { ProofReviewCard } from "./proof-review-card/proof-review-card";
import styles from "./proof-section.module.css";

type ProofReview = {
  authorName: string;
  context: string;
  excerpt: string;
  profileImageSrc: string;
  previewExperience?: {
    embedUrl: string;
    frameLabel: string;
    hint: string;
    iframeTitle: string;
    openLabel: string;
    viewport: "app" | "desktop";
  };
  projectHref: string;
  projectPreviewAlt: string;
  projectPreviewSrc: string;
  projectTitle: string;
  reviewHref: string;
  sourceLabel: string;
};

type ProofSectionProps = {
  cta?: {
    label: string;
    href: string;
  };
  description: string;
  eyebrow?: string;
  id: string;
  projectKicker?: string;
  projectLinkLabel?: string;
  ratingAriaLabel?: string;
  reviewLinkLabel?: string;
  reviews: ProofReview[];
  title: string;
  trustNote?: string;
};

export function ProofSection({
  cta,
  description,
  id,
  projectKicker = "Project example",
  projectLinkLabel = "View example",
  ratingAriaLabel = "5 out of 5 stars",
  reviewLinkLabel = "View on Google",
  reviews,
  title,
}: ProofSectionProps) {
  const orderedReviews = [...reviews].reverse();
  const renderedReviews = orderedReviews.slice(0, 1);

  return (
    <section className={styles.section} id={id}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
        {cta ? (
          <a
            className={styles.cta}
            href={cta.href}
            rel="noreferrer"
            target="_blank"
          >
            {cta.label}
          </a>
        ) : null}
      </div>

      <div className={styles.grid} role="list">
        {renderedReviews.map((review, index) => {
          const isAppLeadCard =
            index === 0 && review.previewExperience?.viewport === "app";
          const secondaryReview = isAppLeadCard ? orderedReviews[1] : undefined;

          return (
            <article
              className={`${styles.card}${isAppLeadCard ? ` ${styles.cardAppLead}` : ""}`}
              key={`${review.authorName}-${review.context}`}
              role="listitem"
            >
              <div className={styles.cardGlow} aria-hidden="true" />
              <div className={styles.cardMain}>
                <div className={styles.cardContent}>
                  <ProofReviewCard
                    authorName={review.authorName}
                    context={review.context}
                    excerpt={review.excerpt}
                    profileImageSrc={review.profileImageSrc}
                    ratingAriaLabel={ratingAriaLabel}
                    reviewHref={review.reviewHref}
                    reviewLinkLabel={reviewLinkLabel}
                    sourceLabel={review.sourceLabel}
                  />

                  {secondaryReview ? (
                    <div className={styles.secondaryReview}>
                      <ProofReviewCard
                        authorName={secondaryReview.authorName}
                        context={secondaryReview.context}
                        excerpt={secondaryReview.excerpt}
                        profileImageSrc={secondaryReview.profileImageSrc}
                        ratingAriaLabel={ratingAriaLabel}
                        reviewHref={secondaryReview.reviewHref}
                        reviewLinkLabel={reviewLinkLabel}
                        sourceLabel={secondaryReview.sourceLabel}
                        tone="nested"
                      >
                        {secondaryReview.previewExperience ? (
                          <ProofPreviewExperience
                            compact
                            embedUrl={
                              secondaryReview.previewExperience.embedUrl
                            }
                            frameLabel={
                              secondaryReview.previewExperience.frameLabel
                            }
                            hint={secondaryReview.previewExperience.hint}
                            iframeTitle={
                              secondaryReview.previewExperience.iframeTitle
                            }
                            openLabel={
                              secondaryReview.previewExperience.openLabel
                            }
                            projectHref={secondaryReview.projectHref}
                            projectKicker={projectKicker}
                            projectLinkLabel={projectLinkLabel}
                            projectTitle={secondaryReview.projectTitle}
                            viewport={
                              secondaryReview.previewExperience.viewport
                            }
                          />
                        ) : null}
                      </ProofReviewCard>
                    </div>
                  ) : null}
                </div>

                {review.previewExperience ? (
                  <div className={styles.primaryPreview}>
                    <ProofPreviewExperience
                      embedUrl={review.previewExperience.embedUrl}
                      frameLabel={review.previewExperience.frameLabel}
                      hint={review.previewExperience.hint}
                      iframeTitle={review.previewExperience.iframeTitle}
                      openLabel={review.previewExperience.openLabel}
                      projectHref={review.projectHref}
                      projectKicker={projectKicker}
                      projectLinkLabel={projectLinkLabel}
                      projectTitle={review.projectTitle}
                      viewport={review.previewExperience.viewport}
                    />
                  </div>
                ) : (
                  <a
                    className={styles.projectPreview}
                    href={review.projectHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className={styles.projectPreviewMedia}>
                      <Image
                        alt={review.projectPreviewAlt}
                        className={styles.projectPreviewImage}
                        height={440}
                        src={review.projectPreviewSrc}
                        width={720}
                      />
                    </div>
                    <div className={styles.projectPreviewMeta}>
                      <div className={styles.projectPreviewCopy}>
                        <span className={styles.projectKicker}>
                          {projectKicker}
                        </span>
                        <p className={styles.projectTitle}>
                          {review.projectTitle}
                        </p>
                      </div>
                      <span className={styles.projectLink}>
                        {projectLinkLabel}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
