"use client";

import { CollapsibleSection } from "../collapsible-section/collapsible-section";
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
  return (
    <CollapsibleSection
      className={styles.section}
      description={body}
      labelCollapse={labelCollapse}
      labelExpand={labelExpand}
      meta={<span className={styles.badge}>{badgeLabel}</span>}
      title={title}
    />
  );
}
