import {
  faBriefcase,
  faCalculator,
  faCamera,
  faChalkboardUser,
  faCircleQuestion,
  faHammer,
  faLayerGroup,
  faLocationDot,
  faMagnifyingGlassChart,
  faScaleBalanced,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Badge } from "@invessiv/ui";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";

type LeadCategoryBadgeProps = {
  className?: string;
  categoryKey?: string;
  label: string;
};

const CATEGORY_CONFIG: Record<
  string,
  { icon: IconDefinition; tone: BadgeToneValue }
> = {
  coaches: {
    icon: faChalkboardUser,
    tone: BadgeTone.Primary,
  },
  consultants: {
    icon: faUserTie,
    tone: BadgeTone.Danger,
  },
  craftspeople: {
    icon: faHammer,
    tone: BadgeTone.Warning,
  },
  "local-service-providers": {
    icon: faLocationDot,
    tone: BadgeTone.Success,
  },
  "small-b2b-providers": {
    icon: faBriefcase,
    tone: BadgeTone.Purple,
  },
  photographers: {
    icon: faCamera,
    tone: BadgeTone.Info,
  },
  lawyers: {
    icon: faScaleBalanced,
    tone: BadgeTone.Indigo,
  },
  "tax-advisors": {
    icon: faCalculator,
    tone: BadgeTone.Teal,
  },
  appraisers: {
    icon: faMagnifyingGlassChart,
    tone: BadgeTone.Lime,
  },
  other: {
    icon: faCircleQuestion,
    tone: BadgeTone.Orange,
  },
};

export function LeadCategoryBadge({
  className,
  categoryKey,
  label,
}: LeadCategoryBadgeProps) {
  const config = categoryKey ? CATEGORY_CONFIG[categoryKey] : undefined;
  const icon = config?.icon ?? faLayerGroup;
  const tone = config?.tone ?? BadgeTone.Neutral;

  return (
    <Badge
      className={className}
      categoryKey={categoryKey}
      icon={icon}
      kind="category"
      label={label}
      tone={tone}
    />
  );
}
