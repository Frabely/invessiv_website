import { LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX } from "@invessiv/common/constants/generator";
import type { Locale } from "@/config/i18n";
import type { GeneratorUsageLimit } from "@/common/contracts/generator/generator-state";
import type { LinkedInPostGeneratorUsageMeterCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import { formatResetDate } from "@/lib/format-reset-date";
import styles from "./usage-meter.module.css";

type UsageMeterProps = {
  content: LinkedInPostGeneratorUsageMeterCopy;
  locale: Locale;
  usageLimit?: GeneratorUsageLimit;
};

/**
 * Prominent free-test counter for the anonymous generation step. Before the
 * first run it shows the idle hint ("2 free tests"); afterwards the remaining
 * budget, a reset date, and one pip per test (filled = still available).
 */
export function UsageMeter({ content, locale, usageLimit }: UsageMeterProps) {
  const limit = usageLimit?.limit ?? LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX;
  const remaining = usageLimit
    ? Math.max(0, Math.min(usageLimit.remaining, limit))
    : LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX;

  const summary = usageLimit
    ? content.remaining
        .replace("{{remaining}}", String(remaining))
        .replace("{{limit}}", String(limit))
    : content.idle;

  const resetDate = usageLimit
    ? formatResetDate(usageLimit.resetAt, locale)
    : "";

  return (
    <div
      aria-label={content.regionLabel}
      className={styles.meter}
      data-depleted={usageLimit && remaining <= 0 ? "true" : undefined}
      role="group"
    >
      <ul aria-hidden="true" className={styles.pips}>
        {Array.from({ length: Math.max(limit, 1) }, (_, index) => (
          <li
            className={styles.pip}
            data-state={index < remaining ? "free" : "used"}
            key={index}
          />
        ))}
      </ul>
      <p className={styles.summary} aria-live="polite">
        <span className={styles.summaryText}>{summary}</span>
        {resetDate ? (
          <span className={styles.reset}>
            {content.resetPrefix} {resetDate}
          </span>
        ) : null}
      </p>
    </div>
  );
}
