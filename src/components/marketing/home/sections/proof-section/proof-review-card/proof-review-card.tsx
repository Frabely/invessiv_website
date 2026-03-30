import type { ReactNode } from "react";
import Image from "next/image";
import styles from "./proof-review-card.module.css";

type ProofReviewCardProps = {
  authorName: string;
  context: string;
  excerpt: string;
  profileImageSrc: string;
  ratingAriaLabel: string;
  reviewHref: string;
  reviewLinkLabel: string;
  sourceLabel: string;
  children?: ReactNode;
  tone?: "nested" | "plain";
};

function renderStars() {
  return "\u2605\u2605\u2605\u2605\u2605";
}

export function ProofReviewCard({
  authorName,
  context,
  excerpt,
  profileImageSrc,
  ratingAriaLabel,
  reviewHref,
  reviewLinkLabel,
  sourceLabel,
  children,
  tone = "plain",
}: ProofReviewCardProps) {
  return (
    <div className={styles.card} data-tone={tone}>
      <div className={styles.header}>
        <div className={styles.profileWrap}>
          <Image
            alt=""
            className={styles.profileImage}
            height={56}
            src={profileImageSrc}
            width={56}
          />
          <div className={styles.identity}>
            <p className={styles.author}>{authorName}</p>
            <p className={styles.context}>{context}</p>
          </div>
        </div>
        <p aria-label={ratingAriaLabel} className={styles.rating}>
          <span aria-hidden="true">{renderStars()}</span>
        </p>
      </div>

      <blockquote className={styles.quote}>
        <p>{excerpt}</p>
      </blockquote>

      <div className={styles.footer}>
        <span className={styles.source}>{sourceLabel}</span>
        <a
          className={styles.sourceLink}
          href={reviewHref}
          rel="noreferrer"
          target="_blank"
        >
          {reviewLinkLabel}
        </a>
      </div>

      {children}
    </div>
  );
}
