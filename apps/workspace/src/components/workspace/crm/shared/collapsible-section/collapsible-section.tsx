"use client";

import { type ReactNode, useId, useState } from "react";

import { SectionCollapseToggle } from "../section-collapse-toggle/section-collapse-toggle";
import styles from "./collapsible-section.module.css";

type CollapsibleSectionProps = {
  action?: ReactNode;
  after?: ReactNode;
  children?: ReactNode;
  className?: string;
  count?: string;
  defaultExpanded?: boolean;
  description?: string;
  labelCollapse: string;
  labelExpand: string;
  meta?: ReactNode;
  summary?: ReactNode;
  title: string;
};

export function CollapsibleSection({
  action,
  after,
  children,
  className,
  count,
  defaultExpanded = false,
  description,
  labelCollapse,
  labelExpand,
  meta,
  summary,
  title,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const headingId = useId();
  const bodyId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={className ? `${styles.section} ${className}` : styles.section}
    >
      <header className={styles.header}>
        <h3 id={headingId}>{title}</h3>
        {summary ? <div className={styles.summary}>{summary}</div> : null}
        <div className={styles.controls}>
          {count ? <span className={styles.count}>{count}</span> : null}
          {meta}
          {action}
          <SectionCollapseToggle
            controls={bodyId}
            expanded={expanded}
            labelCollapse={labelCollapse}
            labelExpand={labelExpand}
            onToggleAction={() => setExpanded((current) => !current)}
          />
        </div>
      </header>
      {expanded ? (
        <div className={styles.body} id={bodyId}>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
          {children}
        </div>
      ) : null}
      {after}
    </section>
  );
}
