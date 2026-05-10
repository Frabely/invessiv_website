import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { LeadBadgeKind } from "@/common/constants/leads/badges/lead-badge-kinds";
import type { LeadBadgeTone } from "@/common/constants/leads/badges/lead-badge-tones";
import styles from "./lead-badge.module.css";

type LeadBadgeProps = {
  className?: string;
  icon: IconDefinition;
  categoryKey?: string;
  kind?: LeadBadgeKind;
  label: string;
  tone: LeadBadgeTone;
};

export function LeadBadge({
  className,
  icon,
  categoryKey,
  kind,
  label,
  tone,
}: LeadBadgeProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <span
      className={rootClassName}
      data-category-key={categoryKey}
      data-kind={kind}
      data-tone={tone}
    >
      <FontAwesomeIcon aria-hidden="true" className={styles.icon} icon={icon} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
