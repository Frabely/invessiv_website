import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBolt,
  faBriefcase,
  faBuilding,
  faCalculator,
  faCamera,
  faChalkboardUser,
  faClipboardCheck,
  faHammer,
  faLocationDot,
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { AudienceIconKey } from "@/i18n/dictionaries/landing/audience";

const ICON_BY_KEY = {
  building: faBuilding,
  calculator: faCalculator,
  camera: faCamera,
  clipboard: faClipboardCheck,
  coach: faChalkboardUser,
  consultant: faBriefcase,
  hammer: faHammer,
  pin: faLocationDot,
  scales: faScaleBalanced,
  spark: faBolt,
} satisfies Record<AudienceIconKey, IconDefinition>;

type AudienceIconProps = {
  iconKey: AudienceIconKey;
};

export function AudienceIcon({ iconKey }: AudienceIconProps) {
  return <FontAwesomeIcon aria-hidden="true" icon={ICON_BY_KEY[iconKey]} />;
}
