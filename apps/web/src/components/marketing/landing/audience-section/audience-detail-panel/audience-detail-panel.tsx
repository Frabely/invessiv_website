import type {
  AudienceIconKey,
  LandingAudienceDetail,
} from "@/i18n/dictionaries/landing/audience";
import { AudienceIcon } from "../audience-icon";
import styles from "./audience-detail-panel.module.css";

type AudienceDetailPanelProps = {
  detail: LandingAudienceDetail;
  iconKey: AudienceIconKey;
  label: string;
  outcomeLabel: string;
};

export function AudienceDetailPanel({
  detail,
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

      <p className={styles.headline}>{detail.headline}</p>

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
    </article>
  );
}
