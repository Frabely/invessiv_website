"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./section-collapse-toggle.module.css";

type SectionCollapseToggleProps = {
  controls: string;
  expanded: boolean;
  labelCollapse: string;
  labelExpand: string;
  onToggleAction: () => void;
};

export function SectionCollapseToggle({
  controls,
  expanded,
  labelCollapse,
  labelExpand,
  onToggleAction,
}: SectionCollapseToggleProps) {
  const label = expanded ? labelCollapse : labelExpand;
  return (
    <button
      aria-controls={controls}
      aria-expanded={expanded}
      aria-label={label}
      className={styles.toggle}
      data-expanded={expanded}
      onClick={onToggleAction}
      title={label}
      type="button"
    >
      <FontAwesomeIcon aria-hidden="true" icon={faChevronDown} />
    </button>
  );
}
