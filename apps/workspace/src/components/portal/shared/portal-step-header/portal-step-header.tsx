import type { ReactNode } from "react";
import { PortalBackLink } from "@/components/portal/portal-back-link/portal-back-link";
import styles from "./portal-step-header.module.css";

export type PortalStepHeaderProps = {
  backHref: string;
  /** Full wording of the way back; the accessible name of the link. */
  backLabel: string;
  /** Short visible wording of the way back. */
  backShortLabel: string;
  /** The step track below the title row. */
  children?: ReactNode;
  /** Where the page stands as a whole, at the end of the title row. */
  summary?: ReactNode;
  title: string;
};

/**
 * The head of a page with steps: the way back, the title and the overall state in one row, the steps
 * below. It stays in view while the page scrolls, so the customer always sees where they are.
 */
export function PortalStepHeader({
  backHref,
  backLabel,
  backShortLabel,
  children,
  summary,
  title,
}: PortalStepHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <PortalBackLink
          ariaLabel={backLabel}
          href={backHref}
          label={backShortLabel}
        />
        <h1 className={styles.title} title={title}>
          {title}
        </h1>
        {summary ? <div className={styles.summary}>{summary}</div> : null}
      </div>
      {children}
    </div>
  );
}
