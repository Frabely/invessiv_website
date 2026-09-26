"use client";

import { useId, useState } from "react";

import { SectionCollapseToggle } from "@/components/workspace/crm/shared/section-collapse-toggle/section-collapse-toggle";
import styles from "./mock-section-card.module.css";

type MockSectionCardProps = {
  badgeLabel: string;
  body: string;
  labelCollapse: string;
  labelExpand: string;
  title: string;
};

/** Reserves the place of a roadmap area that has no implementation yet; never carries data or actions. */
export function MockSectionCard({
  badgeLabel,
  body,
  labelCollapse,
  labelExpand,
  title,
}: MockSectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const bodyId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <header className={styles.head}>
        <h3 id={headingId}>{title}</h3>
        <span className={styles.badge}>{badgeLabel}</span>
        <SectionCollapseToggle
          controls={bodyId}
          expanded={expanded}
          labelCollapse={labelCollapse}
          labelExpand={labelExpand}
          onToggleAction={() => setExpanded((current) => !current)}
        />
      </header>
      {expanded ? (
        <p className={styles.body} id={bodyId}>
          {body}
        </p>
      ) : null}
    </section>
  );
}
