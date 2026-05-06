import Link from "next/link";
import styles from "./leads-empty-state.module.css";

type LeadsEmptyStateProps = {
  actionHref?: string;
  actionLabel: string;
  description: string;
  title: string;
  variant: "empty" | "filtered";
};

function getIconPath(variant: "empty" | "filtered") {
  return variant === "filtered"
    ? "M4 6h16M7 12h10M10 18h4"
    : "M12 5v14M5 12h14";
}

function renderAction(
  actionHref: string | undefined,
  actionLabel: string,
  variant: "empty" | "filtered",
) {
  const commonContent = (
    <>
      <span aria-hidden="true" className={styles.actionIcon}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.25}
          viewBox="0 0 24 24"
        >
          <path d={getIconPath(variant)} />
        </svg>
      </span>
      <span className={styles.actionLabel}>{actionLabel}</span>
    </>
  );

  if (!actionHref) {
    return (
      <button
        aria-disabled="true"
        className={styles.primaryAction}
        disabled
        type="button"
      >
        {commonContent}
      </button>
    );
  }

  return (
    <Link className={styles.primaryAction} href={actionHref}>
      {commonContent}
    </Link>
  );
}

export function LeadsEmptyState({
  actionHref,
  actionLabel,
  description,
  title,
  variant,
}: LeadsEmptyStateProps) {
  return (
    <section className={styles.shell}>
      <div className={styles.panel} data-variant={variant}>
        <div className={styles.iconFrame} aria-hidden="true">
          <svg
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d={getIconPath(variant)} />
          </svg>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            {renderAction(actionHref, actionLabel, variant)}
          </div>
        </div>
      </div>
    </section>
  );
}
