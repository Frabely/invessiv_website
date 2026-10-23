import type { ReferenceAvatarKey } from "@/common/constants/marketing/reference-avatar-key";
import { ReferenceAvatar } from "./reference-avatar/reference-avatar";
import { ReferenceFullQuote } from "./reference-full-quote/reference-full-quote";
import { ReferenceQuote } from "./reference-quote/reference-quote";
import styles from "./reference-testimonial.module.css";

type ReferenceTestimonialProps = {
  authorName: string;
  avatarAlt?: string;
  avatarKey?: ReferenceAvatarKey;
  className?: string;
  collapseLabel: string;
  expandLabel: string;
  // Must be an exact excerpt of `quote`; the full quote stays available behind a toggle.
  highlight?: string;
  quote: string;
  role: string;
};

export function ReferenceTestimonial({
  authorName,
  avatarAlt,
  avatarKey,
  className,
  collapseLabel,
  expandLabel,
  highlight,
  quote,
  role,
}: ReferenceTestimonialProps) {
  const testimonialClassName = className
    ? `${styles.testimonial} ${className}`
    : styles.testimonial;

  const identity = (
    <div className={styles.identity}>
      <ReferenceAvatar
        alt={avatarAlt}
        authorName={authorName}
        avatarKey={avatarKey}
      />
      <div className={styles.identityCopy}>
        <h3 className={styles.author}>{authorName}</h3>
        <p className={styles.role}>{role}</p>
      </div>
    </div>
  );

  if (highlight) {
    return (
      <div className={testimonialClassName}>
        <p className={styles.highlight}>
          <q>{highlight}</q>
        </p>
        {identity}
        <ReferenceFullQuote
          collapseLabel={collapseLabel}
          expandLabel={expandLabel}
          quote={quote}
        />
      </div>
    );
  }

  return (
    <div className={testimonialClassName}>
      {identity}
      <ReferenceQuote
        collapseLabel={collapseLabel}
        expandLabel={expandLabel}
        quote={quote}
      />
    </div>
  );
}
