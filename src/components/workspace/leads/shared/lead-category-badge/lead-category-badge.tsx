import {
  faBriefcase,
  faCamera,
  faChalkboardUser,
  faHammer,
  faLayerGroup,
  faLocationDot,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { LeadBadgeKind } from "@/common/constants/leads/badges/lead-badge-kinds";
import {
  LeadBadgeTone,
  type LeadBadgeTone as LeadBadgeToneValue,
} from "@/common/constants/leads/badges/lead-badge-tones";
import { LeadBadge } from "../lead-badge/lead-badge";

type LeadCategoryBadgeProps = {
  className?: string;
  categoryKey?: string;
  label: string;
};

const CATEGORY_CONFIG: Record<
  string,
  { icon: IconDefinition; tone: LeadBadgeToneValue }
> = {
  coaches: {
    icon: faChalkboardUser,
    tone: LeadBadgeTone.Primary,
  },
  consultants: {
    icon: faUserTie,
    tone: LeadBadgeTone.Danger,
  },
  craftspeople: {
    icon: faHammer,
    tone: LeadBadgeTone.Warning,
  },
  "local-service-providers": {
    icon: faLocationDot,
    tone: LeadBadgeTone.Success,
  },
  "small-b2b-providers": {
    icon: faBriefcase,
    tone: LeadBadgeTone.Purple,
  },
  photographers: {
    icon: faCamera,
    tone: LeadBadgeTone.Info,
  },
};

export function LeadCategoryBadge({
  className,
  categoryKey,
  label,
}: LeadCategoryBadgeProps) {
  const config = categoryKey ? CATEGORY_CONFIG[categoryKey] : undefined;
  const icon = config?.icon ?? faLayerGroup;
  const tone = config?.tone ?? LeadBadgeTone.Neutral;

  return (
    <LeadBadge
      className={className}
      categoryKey={categoryKey}
      icon={icon}
      kind={LeadBadgeKind.Category}
      label={label}
      tone={tone}
    />
  );
}
