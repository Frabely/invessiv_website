import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faArrowRightLong, faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { HeroTrustIconKey } from "@/common/constants/marketing/hero-trust-icon-key";
import type { HeroTrustPoint } from "@/common/contracts/marketing/hero-trust-point";
import styles from "./hero-trust-points.module.css";

const ICON_BY_KEY = {
  directContact: faUser,
  noAgencyLoop: faArrowRightLong,
  softwareBackground: faCode,
} satisfies Record<HeroTrustIconKey, IconDefinition>;

type HeroTrustPointsProps = {
  className?: string;
  points: HeroTrustPoint[];
};

export function HeroTrustPoints({ className, points }: HeroTrustPointsProps) {
  if (!points.length) {
    return null;
  }

  return (
    <ul className={[styles.list, className].filter(Boolean).join(" ")}>
      {points.map((point) => (
        <li className={styles.item} key={point.iconKey}>
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.icon}
            icon={ICON_BY_KEY[point.iconKey]}
          />
          <span>{point.label}</span>
        </li>
      ))}
    </ul>
  );
}
