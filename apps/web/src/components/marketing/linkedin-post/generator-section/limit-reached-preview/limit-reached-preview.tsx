import { PrimaryCtaLink } from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import type { GeneratorUsageLimit } from "@/common/contracts/generator/generator-state";
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
 * not an error look: positive framing, reset hint, and a primary CTA into the
 * contact form (prefilled with any identity captured in the lead step).
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
        <p className={styles.badge}>{content.badge}</p>
        <h3 className={styles.headline}>{content.headline}</h3>
        <p className={styles.body}>{content.body}</p>
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
