import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArchive, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";

type LineItemTemplateStatusBadgeProps = {
  label: string;
  status: LineItemTemplateStatus;
};

const STATUS_ICONS: Record<LineItemTemplateStatus, IconDefinition> = {
  [LineItemTemplateStatus.Active]: faCircleCheck,
  [LineItemTemplateStatus.Archived]: faArchive,
};

const STATUS_TONES: Record<LineItemTemplateStatus, BadgeTone> = {
  [LineItemTemplateStatus.Active]: BadgeTone.Success,
  [LineItemTemplateStatus.Archived]: BadgeTone.Neutral,
};

export function LineItemTemplateStatusBadge({
  label,
  status,
}: LineItemTemplateStatusBadgeProps) {
  return (
    <Badge
      icon={STATUS_ICONS[status]}
      kind="status"
      label={label}
      tone={STATUS_TONES[status]}
    />
  );
}
