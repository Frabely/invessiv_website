import { LeadSource } from "@/common/constants/leads/lead-sources";
import styles from "./lead-source-badge.module.css";

type LeadSourceBadgeProps = {
  className?: string;
  label: string;
  source: LeadSource;
};

function getSourceIcon(source: LeadSource) {
  switch (source) {
    case LeadSource.Webform:
      return (
        <>
          <rect height="16" rx="3" width="16" x="4" y="4" />
          <path d="M7 9h10" />
          <path d="M7 13h6" />
        </>
      );
    case LeadSource.Manual:
      return (
        <>
          <circle cx="12" cy="8.5" r="3" />
          <path d="M6.5 19c0-3.1 2.4-5.5 5.5-5.5s5.5 2.4 5.5 5.5" />
        </>
      );
    case LeadSource.Import:
      return (
        <>
          <path d="M12 4v9" />
          <path d="M8.25 9.25 12 13l3.75-3.75" />
          <path d="M5 19h14v-4H5z" />
        </>
      );
    default:
      return null;
  }
}

export function LeadSourceBadge({
  className,
  label,
  source,
}: LeadSourceBadgeProps) {
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <span className={rootClassName} data-source={source}>
      <span aria-hidden="true" className={styles.icon}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          {getSourceIcon(source)}
        </svg>
      </span>
      <span className={styles.label}>{label}</span>
    </span>
  );
}
