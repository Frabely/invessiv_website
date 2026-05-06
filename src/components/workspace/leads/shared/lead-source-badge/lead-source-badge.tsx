import {
  faFileImport,
  faGlobe,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { LeadSource } from "@/common/constants/leads/lead-sources";
import { LeadBadgeKind } from "@/common/constants/leads/lead-badge-kinds";
import type { LeadBadgeTone as LeadBadgeToneValue } from "@/common/constants/leads/lead-badge-tones";
import { LeadBadgeTone } from "@/common/constants/leads/lead-badge-tones";
import { LeadBadge } from "../lead-badge";

type LeadSourceBadgeProps = {
  className?: string;
  label: string;
  source: LeadSource;
};

const SOURCE_CONFIG: Record<
  LeadSource,
  { icon: IconDefinition; tone: LeadBadgeToneValue }
> = {
  [LeadSource.Webform]: {
    icon: faGlobe,
    tone: LeadBadgeTone.Primary,
  },
  [LeadSource.Manual]: {
    icon: faPen,
    tone: LeadBadgeTone.Warning,
  },
  [LeadSource.Import]: {
    icon: faFileImport,
    tone: LeadBadgeTone.Success,
  },
};

export function LeadSourceBadge({
  className,
  label,
  source,
}: LeadSourceBadgeProps) {
  const { icon, tone } = SOURCE_CONFIG[source];

  return (
    <LeadBadge
      className={className}
      icon={icon}
      kind={LeadBadgeKind.Source}
      label={label}
      tone={tone}
    />
  );
}
