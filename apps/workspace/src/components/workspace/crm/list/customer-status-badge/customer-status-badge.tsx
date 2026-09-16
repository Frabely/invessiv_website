import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArchive,
  faCircleCheck,
  faCirclePause,
} from "@fortawesome/free-solid-svg-icons";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";

type CustomerStatusBadgeProps = {
  label: string;
  status: CustomerStatus;
};

const STATUS_ICONS: Record<CustomerStatus, IconDefinition> = {
  [CustomerStatus.Active]: faCircleCheck,
  [CustomerStatus.Paused]: faCirclePause,
  [CustomerStatus.Archived]: faArchive,
};

const STATUS_TONES: Record<CustomerStatus, BadgeTone> = {
  [CustomerStatus.Active]: BadgeTone.Success,
  [CustomerStatus.Paused]: BadgeTone.Warning,
  [CustomerStatus.Archived]: BadgeTone.Neutral,
};

export function CustomerStatusBadge({
  label,
  status,
}: CustomerStatusBadgeProps) {
  return (
    <Badge
      icon={STATUS_ICONS[status]}
      kind="status"
      label={label}
      tone={STATUS_TONES[status]}
    />
  );
}
