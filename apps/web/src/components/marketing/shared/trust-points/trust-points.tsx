import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowRightLong,
  faCode,
  faDownload,
  faGift,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { TrustPointIconKey } from "@/common/constants/marketing/trust-point-icon-key";
import type { TrustPoint } from "@/common/contracts/marketing/trust-point";
import styles from "./trust-points.module.css";

const ICON_BY_KEY = {
  directContact: faUser,
  downloadIncluded: faDownload,
  free: faGift,
  noAccount: faUserSlash,
  noAgencyLoop: faArrowRightLong,
  softwareBackground: faCode,
} satisfies Record<TrustPointIconKey, IconDefinition>;

type TrustPointsProps = {
  ariaLabel?: string;
  className?: string;
  points: TrustPoint[];
};

export function TrustPoints({
  ariaLabel,
  className,
  points,
}: TrustPointsProps) {
  if (!points.length) {
    return null;
  }

  return (
    <ul
      aria-label={ariaLabel}
      className={[styles.list, className].filter(Boolean).join(" ")}
    >
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
