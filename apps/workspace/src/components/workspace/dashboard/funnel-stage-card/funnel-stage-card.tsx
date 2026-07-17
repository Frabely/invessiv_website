import type { ContactLeadStatus as ContactLeadStatusValue } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LEAD_STATUS_BADGE_TONES } from "@/common/constants/leads/badges/lead-status-badge-tones";
import { LeadStatusBadge } from "../../shared/lead-status-badge/lead-status-badge";
import styles from "./funnel-stage-card.module.css";

type FunnelStageCardProps = {
  ariaLabel: string;
  countLabel: string;
  index: number;
  shareLabel?: string;
  shareRatio?: number | null;
  status: ContactLeadStatusValue;
  statusLabel: string;
};

export function FunnelStageCard({
  ariaLabel,
  countLabel,
  index,
  shareLabel,
  shareRatio,
  status,
  statusLabel,
}: FunnelStageCardProps) {
  const normalizedShareRatio =
    shareRatio === null || shareRatio === undefined
      ? null
      : Math.max(0, Math.min(shareRatio, 1));

  return (
    <article
      aria-label={ariaLabel}
      className={styles.card}
      data-index={index}
      data-stage={status}
      data-tone={LEAD_STATUS_BADGE_TONES[status]}
      role="group"
    >
      <span aria-hidden="true" className={styles.accent} />
      <div className={styles.top}>
        <LeadStatusBadge
          className={styles.badge}
          label={statusLabel}
          status={status}
        />
      </div>
      <div className={styles.body}>
        <span className={styles.value}>{countLabel}</span>
      </div>
      {shareLabel !== undefined ? (
        <div className={styles.shareRow}>
          <progress
            aria-hidden="true"
            className={styles.barTrack}
            data-empty={normalizedShareRatio === null ? "true" : "false"}
            max={1}
            value={normalizedShareRatio ?? 0}
          />
          <span className={styles.shareLabel}>{shareLabel}</span>
        </div>
      ) : null}
    </article>
  );
}
