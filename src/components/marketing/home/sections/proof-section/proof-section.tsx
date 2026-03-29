import Image from "next/image";
import styles from "./proof-section.module.css";

type ProofReview = {
  authorName: string;
  context: string;
  excerpt: string;
  profileImageSrc: string;
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

function renderStars() {
  return "★★★★★";
}

export function ProofSection({
  cta,
  description,
  eyebrow,
  id,
  projectKicker = "Project example",
  projectLinkLabel = "View example",
  ratingAriaLabel = "5 out of 5 stars",
  reviewLinkLabel = "View on Google",
  reviews,
  title,
  trustNote,
}: ProofSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
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
        {reviews.map((review) => (
          <article
            className={styles.card}
            key={`${review.authorName}-${review.context}`}
            role="listitem"
          >
            <div className={styles.cardGlow} aria-hidden="true" />
            <div className={styles.cardHeader}>
              <div className={styles.profileWrap}>
                <Image
                  alt=""
                  className={styles.profileImage}
                  height={56}
                  src={review.profileImageSrc}
                  width={56}
                />
                <div className={styles.identity}>
                  <p className={styles.author}>{review.authorName}</p>
                  <p className={styles.context}>{review.context}</p>
                </div>
              </div>
              <p aria-label={ratingAriaLabel} className={styles.rating}>
                <span aria-hidden="true">{renderStars()}</span>
              </p>
            </div>

            <blockquote className={styles.quote}>
              <p>{review.excerpt}</p>
            </blockquote>

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
                  <span className={styles.projectKicker}>{projectKicker}</span>
                  <p className={styles.projectTitle}>{review.projectTitle}</p>
                </div>
                <span className={styles.projectLink}>{projectLinkLabel}</span>
              </div>
            </a>

            <div className={styles.cardFooter}>
              <span className={styles.source}>{review.sourceLabel}</span>
              <a
                className={styles.sourceLink}
                href={review.reviewHref}
                rel="noreferrer"
                target="_blank"
              >
                {reviewLinkLabel}
              </a>
            </div>
          </article>
        ))}
      </div>

      {trustNote ? <p className={styles.trustNote}>{trustNote}</p> : null}
    </section>
  );
}
