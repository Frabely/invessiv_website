import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";

export type ServiceRequestKindBadgeProps = {
  label: string;
};

export function ServiceRequestKindBadge({
  label,
}: ServiceRequestKindBadgeProps) {
  return (
    <Badge
      icon={faLayerGroup}
      kind="status"
      label={label}
      tone={BadgeTone.Neutral}
    />
  );
}
