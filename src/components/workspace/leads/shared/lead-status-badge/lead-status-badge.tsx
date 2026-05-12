import {
  faArchive,
  faCircleCheck,
  faCirclePause,
  faCirclePlus,
  faCircleXmark,
  faComments,
  faFileSignature,
  faHourglassHalf,
  faLayerGroup,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  CONTACT_LEAD_STATUS_ALL,
  ContactLeadStatus,
} from "@/common/constants/contact/contact-lead-statuses";
import { LeadBadgeKind } from "@/common/constants/leads/badges/lead-badge-kinds";
import type { LeadBadgeTone as LeadBadgeToneValue } from "@/common/constants/leads/badges/lead-badge-tones";
import { LeadBadgeTone } from "@/common/constants/leads/badges/lead-badge-tones";
import { LeadBadge } from "../lead-badge/lead-badge";

export type LeadStatusBadgeStatus =
  | ContactLeadStatus
  | typeof CONTACT_LEAD_STATUS_ALL;

type LeadStatusBadgeProps = {
  className?: string;
  label: string;
  status: LeadStatusBadgeStatus;
};

const STATUS_CONFIG: Record<
  LeadStatusBadgeStatus,
  {
    icon: IconDefinition;
    tone: LeadBadgeToneValue;
  }
> = {
  [CONTACT_LEAD_STATUS_ALL]: {
    icon: faLayerGroup,
    tone: LeadBadgeTone.Neutral,
  },
  [ContactLeadStatus.New]: {
    icon: faCirclePlus,
    tone: LeadBadgeTone.Info,
  },
  [ContactLeadStatus.PendingReview]: {
    icon: faHourglassHalf,
    tone: LeadBadgeTone.Warning,
  },
  [ContactLeadStatus.Contacted]: {
    icon: faComments,
    tone: LeadBadgeTone.Primary,
  },
  [ContactLeadStatus.Qualified]: {
    icon: faCircleCheck,
    tone: LeadBadgeTone.Orange,
  },
  [ContactLeadStatus.Proposal]: {
    icon: faFileSignature,
    tone: LeadBadgeTone.Purple,
  },
  [ContactLeadStatus.OnHold]: {
    icon: faCirclePause,
    tone: LeadBadgeTone.Neutral,
  },
  [ContactLeadStatus.Won]: {
    icon: faTrophy,
    tone: LeadBadgeTone.Success,
  },
  [ContactLeadStatus.Lost]: {
    icon: faCircleXmark,
    tone: LeadBadgeTone.Danger,
  },
  [ContactLeadStatus.Archived]: {
    icon: faArchive,
    tone: LeadBadgeTone.Neutral,
  },
};

export function LeadStatusBadge({
  className,
  label,
  status,
}: LeadStatusBadgeProps) {
  const { icon, tone } = STATUS_CONFIG[status];

  return (
    <LeadBadge
      className={className}
      icon={icon}
      kind={LeadBadgeKind.Status}
      label={label}
      tone={tone}
    />
  );
}
