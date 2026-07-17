import type { CSSProperties, ReactNode } from "react";
import type { ContactLeadStatus as ContactLeadStatusValue } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadStatusBadge } from "../../leads/shared";
import { getLeadStatusBadgeTone } from "../../leads/shared/lead-status-badge/lead-status-badge";
import styles from "./funnel-stage-card.module.css";

type FunnelStageCardProps = {
  ariaLabel: string;
  compact?: boolean;
  countLabel: string;
  description?: string;
  detail?: ReactNode;
  footer?: ReactNode;
  index: number;
  shareLabel?: string;
  shareRatio?: number | null;
  status: ContactLeadStatusValue;
  statusLabel: string;
};

export function FunnelStageCard({
  ariaLabel,
  compact = false,
  countLabel,
  description,
  detail,
  footer,
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
      data-compact={compact ? "true" : "false"}
      data-stage={status}
      data-tone={getLeadStatusBadgeTone(status)}
      role="group"
      style={
        {
          "--stage-share":
            normalizedShareRatio === null
              ? "0%"
              : `${normalizedShareRatio * 100}%`,
          "--stage-delay": `${0.08 + index * 0.1}s`,
        } as CSSProperties
      }
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
        {detail}
      </div>
      {shareLabel !== undefined ? (
        <div className={styles.shareRow}>
          <div
            aria-hidden="true"
            className={styles.barTrack}
            data-empty={normalizedShareRatio === null ? "true" : "false"}
          >
            <span className={styles.barFill} />
          </div>
          <span className={styles.shareLabel}>{shareLabel}</span>
        </div>
      ) : null}
      {description !== undefined ? (
        <p className={styles.description}>{description}</p>
      ) : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </article>
  );
}
