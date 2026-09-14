import {
  faFileImport,
  faGlobe,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";
import { Badge } from "@invessiv/ui";
import type { BadgeTone as BadgeToneValue } from "@invessiv/common/constants/ui/badge-tones";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";

type LeadSourceBadgeProps = {
  className?: string;
  label: string;
  source: LeadSource;
};

const SOURCE_CONFIG: Record<
  LeadSource,
  { icon: IconDefinition; tone: BadgeToneValue }
> = {
  [LeadSource.Webform]: {
    icon: faGlobe,
    tone: BadgeTone.Primary,
  },
  [LeadSource.Manual]: {
    icon: faPen,
    tone: BadgeTone.Warning,
  },
  [LeadSource.Import]: {
    icon: faFileImport,
    tone: BadgeTone.Success,
  },
};

export function LeadSourceBadge({
  className,
  label,
  source,
}: LeadSourceBadgeProps) {
  const { icon, tone } = SOURCE_CONFIG[source];

  return (
    <Badge
      className={className}
      icon={icon}
      kind="source"
      label={label}
      tone={tone}
    />
  );
}
