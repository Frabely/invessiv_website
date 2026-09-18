import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArchive, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";

type ServiceTemplateStatusBadgeProps = {
  label: string;
  status: ServiceTemplateStatus;
};

const STATUS_ICONS: Record<ServiceTemplateStatus, IconDefinition> = {
  [ServiceTemplateStatus.Active]: faCircleCheck,
  [ServiceTemplateStatus.Archived]: faArchive,
};

const STATUS_TONES: Record<ServiceTemplateStatus, BadgeTone> = {
  [ServiceTemplateStatus.Active]: BadgeTone.Success,
  [ServiceTemplateStatus.Archived]: BadgeTone.Neutral,
};

export function ServiceTemplateStatusBadge({
  label,
  status,
}: ServiceTemplateStatusBadgeProps) {
  return (
    <Badge
      icon={STATUS_ICONS[status]}
      kind="status"
      label={label}
      tone={STATUS_TONES[status]}
    />
  );
}
