import Image from "next/image";
import googleIcon from "../../../../../../../assets/google-icon-logo-svgrepo-com.svg";
import styles from "./proof-review-card.module.css";

type ProofReviewCardProps = {
  authorName: string;
  context: string;
  excerpt: string;
  profileImageSrc?: string;
  ratingAriaLabel: string;
  reviewHref: string;
  reviewLinkLabel: string;
  sourceLabel: string;
};

function renderStars() {
  return "\u2605\u2605\u2605\u2605\u2605";
}

function getAuthorInitials(authorName: string) {
  const normalizedParts = authorName
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-zÄÖÜäöüß]/g, ""))
    .filter((part) => part.length > 0);

  if (!normalizedParts.length) {
    return "";
  }

  return normalizedParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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
}: ProofReviewCardProps) {
  const authorInitials = getAuthorInitials(authorName);

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.header}>
        <div className={styles.profileWrap}>
          {profileImageSrc ? (
            <Image
              alt=""
              className={styles.profileImage}
              height={64}
              src={profileImageSrc}
              width={64}
            />
          ) : (
            <span aria-hidden="true" className={styles.profileFallback}>
              {authorInitials}
            </span>
          )}
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
        <span className={styles.source}>
          <Image
            alt=""
            aria-hidden="true"
            className={styles.sourceIcon}
            height={22}
            src={googleIcon}
            width={22}
          />
          <span>{sourceLabel}</span>
        </span>
        <a
          className={styles.sourceLink}
          href={reviewHref}
          rel="noreferrer"
          target="_blank"
        >
          {reviewLinkLabel}
        </a>
      </div>
    </article>
  );
}
