import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import styles from "./lead-status-badge.module.css";

type LeadStatusBadgeProps = {
  className?: string;
  label: string;
  status: ContactLeadStatus;
};

export function LeadStatusBadge({
  className,
  label,
  status,
}: LeadStatusBadgeProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <span className={rootClassName} data-status={status}>
      <span aria-hidden="true" className={styles.marker} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
