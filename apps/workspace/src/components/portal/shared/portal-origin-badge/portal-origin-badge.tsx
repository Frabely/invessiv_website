import {
  faCircleArrowDown,
  faCircleArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";

export type PortalOriginBadgeProps = {
  /** True for what the customer added, false for what came from us. */
  fromCustomer: boolean;
  label: string;
};

/** "From us" or "from you" in one look across the portal: blue arrow down, teal arrow up. */
export function PortalOriginBadge({
  fromCustomer,
  label,
}: PortalOriginBadgeProps) {
  return (
    <Badge
      icon={fromCustomer ? faCircleArrowUp : faCircleArrowDown}
      label={label}
      tone={fromCustomer ? BadgeTone.Teal : BadgeTone.Primary}
    />
  );
}
