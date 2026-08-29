import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowTrendDown,
  faCircleQuestion,
  faClockRotateLeft,
  faMobileScreenButton,
  faShieldHalved,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ProblemIconKey } from "@/i18n/dictionaries/marketing/home-ui";

const ICON_BY_KEY = {
  contact: faUserSlash,
  inquiries: faArrowTrendDown,
  mobile: faMobileScreenButton,
  outdated: faClockRotateLeft,
  trust: faShieldHalved,
  unclear: faCircleQuestion,
} satisfies Record<ProblemIconKey, IconDefinition>;

type ProblemIconProps = {
  iconKey: ProblemIconKey;
};

export function ProblemIcon({ iconKey }: ProblemIconProps) {
  return <FontAwesomeIcon aria-hidden="true" icon={ICON_BY_KEY[iconKey]} />;
}
