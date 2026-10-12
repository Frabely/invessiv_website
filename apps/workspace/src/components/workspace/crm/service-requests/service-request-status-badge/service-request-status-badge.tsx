import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBellConcierge,
  faPaperPlane,
  faCircleCheck,
  faCircleXmark,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@invessiv/ui";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
const ICONS: Record<S, IconDefinition> = {
  [S.Requested]: faBellConcierge,
  [S.Offered]: faPaperPlane,
  [S.Accepted]: faCircleCheck,
  [S.Declined]: faCircleXmark,
  [S.Withdrawn]: faRotateLeft,
};
const TONES: Record<S, BadgeTone> = {
  [S.Requested]: BadgeTone.Warning,
  [S.Offered]: BadgeTone.Info,
  [S.Accepted]: BadgeTone.Success,
  [S.Declined]: BadgeTone.Danger,
  [S.Withdrawn]: BadgeTone.Neutral,
};
export function ServiceRequestStatusBadge({
  status,
  label,
}: {
  status: S;
  label: string;
}) {
  return (
    <Badge
      kind="status"
      icon={ICONS[status]}
      tone={TONES[status]}
      label={label}
    />
  );
}
