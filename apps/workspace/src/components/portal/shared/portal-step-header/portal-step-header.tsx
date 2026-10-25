import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@invessiv/ui";
import styles from "./portal-step-header.module.css";

export type PortalStepHeaderProps = {
  /** Accessible name of the breadcrumb navigation. */
  breadcrumbLabel: string;
  /** The step track below the title row. */
  children?: ReactNode;
  overviewHref: string;
  /** Visible wording of the first breadcrumb, the way back to the dashboard. */
  overviewLabel: string;
  /** Where the page stands as a whole, at the end of the title row. */
  summary?: ReactNode;
  title: string;
};

/**
 * The head of a page with steps: the breadcrumb from the dashboard to the page title and the overall
 * state in one row, the steps below. It stays in view while the page scrolls.
 */
export function PortalStepHeader({
  breadcrumbLabel,
  children,
  overviewHref,
  overviewLabel,
  summary,
  title,
}: PortalStepHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <Breadcrumbs
          className={styles.breadcrumbs}
          items={[
            { href: overviewHref, label: overviewLabel },
            { label: title },
          ]}
          largeTargets
          linkComponent={Link}
          navLabel={breadcrumbLabel}
          renderCurrent={(label) => (
            <h1 className={styles.title} title={label}>
              {label}
            </h1>
          )}
        />
        {summary ? <div className={styles.summary}>{summary}</div> : null}
      </div>
      {children}
    </div>
  );
}
