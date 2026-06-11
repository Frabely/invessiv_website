import { PrimaryCtaLink } from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import type { GeneratorUsageLimit } from "@/common/contracts/generator/ui/generator-state";
import type { LinkedInPostGeneratorPreviewLimitReachedCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import { formatResetDate } from "@/lib/format-reset-date";
import styles from "./limit-reached-preview.module.css";

type LimitReachedPreviewProps = {
  content: LinkedInPostGeneratorPreviewLimitReachedCopy;
  followUpHref: string;
  locale: Locale;
  /** Dispatches the contact-form prefill (offer + best-effort identity). */
  onRequestCustomWorkflow: () => void;
  usageLimit: GeneratorUsageLimit;
};

/**
 * Conversion-oriented state when the free-test budget is used up. Deliberately
 * not an error look: a celebratory completion seal, positive framing, a reset
 * hint, and a primary CTA into the contact form (prefilled with any identity
 * captured in the lead step).
 */
export function LimitReachedPreview({
  content,
  followUpHref,
  locale,
  onRequestCustomWorkflow,
  usageLimit,
}: LimitReachedPreviewProps) {
  const resetDate = formatResetDate(usageLimit.resetAt, locale);

  return (
    <div className={styles.preview} data-state="limit-reached">
      <div className={styles.card}>
        <span className={styles.glow} aria-hidden="true" />
        <div className={styles.head}>
          <span className={styles.seal} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 12.6l4.8 4.8L19.6 6.7" />
            </svg>
          </span>
          <p className={styles.badge}>{content.badge}</p>
        </div>
        <h3 className={styles.headline}>{content.headline}</h3>
        <p className={styles.body}>{content.body}</p>
      </div>
      <div className={styles.actionBar}>
        {resetDate ? (
          <p className={styles.reset}>
            {content.resetPrefix} {resetDate}
          </p>
        ) : null}
        <PrimaryCtaLink
          aria-label={content.ctaAriaLabel}
          className={styles.cta}
          href={followUpHref}
          onClick={onRequestCustomWorkflow}
        >
          {content.ctaLabel}
        </PrimaryCtaLink>
      </div>
    </div>
  );
}
