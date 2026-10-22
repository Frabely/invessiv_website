import Link from "next/link";
import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { REFERENCES_PAGE_SECTION_IDS } from "@/config/navigation/references";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import buttonStyles from "@/components/shared/button/button.module.css";
import type { Locale } from "@/config/i18n";
import { getLocalizedSectionHref } from "@/config/navigation/home";
import type { ReferencesClosingCtaContent } from "@/i18n/dictionaries/marketing/references";
import styles from "./references-closing-cta.module.css";

type ReferencesClosingCtaProps = {
  content: ReferencesClosingCtaContent;
  locale: Locale;
  titleId: string;
};

export function ReferencesClosingCta({
  content,
  locale,
  titleId,
}: ReferencesClosingCtaProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={styles.closingCta}
      id={REFERENCES_PAGE_SECTION_IDS.closingCta}
    >
      <div className={styles.closingCopy}>
        <h2 className={styles.closingTitle} id={titleId}>
          {content.title}
        </h2>
        <p className={styles.closingText}>{content.supportingText}</p>
      </div>

      <div className={styles.closingActions}>
        <PrimaryCtaLink
          href={getLocalizedSectionHref(locale, "contact")}
          useNextLink
          {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
            cta: AnalyticsCtaId.ReferencesClosingPrimary,
            target: AnalyticsTarget.ContactForm,
          })}
        >
          {content.primaryLabel}
        </PrimaryCtaLink>
        <Link
          className={`${buttonStyles.button} ${buttonStyles.ghost}`}
          href={getLocalizedSectionHref(locale, "services")}
          {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
            cta: AnalyticsCtaId.ReferencesClosingSecondary,
            target: AnalyticsTarget.Services,
          })}
        >
          {content.secondaryLabel}
        </Link>
      </div>
    </section>
  );
}
