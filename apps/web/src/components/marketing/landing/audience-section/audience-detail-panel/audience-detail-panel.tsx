import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import type {
  AudienceIconKey,
  LandingAudienceDetail,
} from "@/i18n/dictionaries/landing/audience";
import type { LandingSectionCtaContent } from "@/i18n/dictionaries/landing/types";
import { AudienceIcon } from "../audience-icon";
import styles from "./audience-detail-panel.module.css";

type AudienceDetailPanelProps = {
  cta?: LandingSectionCtaContent;
  detail: LandingAudienceDetail;
  headlineId?: string;
  iconKey: AudienceIconKey;
  label: string;
  outcomeLabel: string;
};

export function AudienceDetailPanel({
  cta,
  detail,
  headlineId,
  iconKey,
  label,
  outcomeLabel,
}: AudienceDetailPanelProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span aria-hidden="true" className={styles.icon}>
          <AudienceIcon iconKey={iconKey} />
        </span>
        <span className={styles.label}>{label}</span>
      </header>

      <p className={styles.headline} id={headlineId}>
        {detail.headline}
      </p>

      <ul className={styles.problems}>
        {detail.problems.map((problem) => (
          <li className={styles.problem} key={problem}>
            {problem}
          </li>
        ))}
      </ul>

      <div className={styles.outcome}>
        <span className={styles.outcomeLabel}>{outcomeLabel}</span>
        <p className={styles.outcomeText}>{detail.outcome}</p>
      </div>

      {cta ? (
        <PrimaryCtaLink
          className={styles.cta}
          {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
            cta: AnalyticsCtaId.LandingAudiencePrimary,
            target: AnalyticsTarget.ContactForm,
          })}
          href={cta.href}
        >
          {cta.label}
        </PrimaryCtaLink>
      ) : null}
    </article>
  );
}
