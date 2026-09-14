import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import styles from "./badge.module.css";

export type BadgeProps = {
  categoryKey?: string;
  className?: string;
  icon: IconDefinition;
  kind?: string;
  label: string;
  tone: BadgeTone;
};

export function Badge({
  categoryKey,
  className,
  icon,
  kind,
  label,
  tone,
}: BadgeProps) {
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
