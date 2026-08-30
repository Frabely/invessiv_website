import type { ReferenceAvatarKey } from "@/common/constants/marketing/reference-avatar-key";
import { ReferenceAvatar } from "./reference-avatar/reference-avatar";
import { ReferenceQuote } from "./reference-quote/reference-quote";
import styles from "./reference-testimonial.module.css";

type ReferenceTestimonialProps = {
  authorName: string;
  avatarAlt?: string;
  avatarKey?: ReferenceAvatarKey;
  className?: string;
  collapseLabel: string;
  expandLabel: string;
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
  quote,
  role,
}: ReferenceTestimonialProps) {
  const testimonialClassName = className
    ? `${styles.testimonial} ${className}`
    : styles.testimonial;

  return (
    <div className={testimonialClassName}>
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

      <ReferenceQuote
        collapseLabel={collapseLabel}
        expandLabel={expandLabel}
        quote={quote}
      />
    </div>
  );
}
