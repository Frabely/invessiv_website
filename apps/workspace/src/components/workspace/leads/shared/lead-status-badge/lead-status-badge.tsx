import {
  faArchive,
  faArrowsRotate,
  faBell,
  faCalendarCheck,
  faCircleCheck,
  faCirclePause,
  faCirclePlus,
  faCircleXmark,
  faComments,
  faFileSignature,
  faHandshake,
  faHourglassHalf,
  faLayerGroup,
  faPhoneSlash,
  faPhoneVolume,
  faReply,
  faTrophy,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  CONTACT_LEAD_STATUS_ALL,
  ContactLeadStatus,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadBadgeKind } from "@invessiv/common/constants/leads/badges/lead-badge-kinds";
import type { LeadBadgeTone as LeadBadgeToneValue } from "@invessiv/common/constants/leads/badges/lead-badge-tones";
import { LeadBadgeTone } from "@invessiv/common/constants/leads/badges/lead-badge-tones";
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
  [ContactLeadStatus.ConnectionRequested]: {
    icon: faUserPlus,
    tone: LeadBadgeTone.Magenta,
  },
  [ContactLeadStatus.Connected]: {
    icon: faHandshake,
    tone: LeadBadgeTone.Teal,
  },
  [ContactLeadStatus.FollowUp]: {
    icon: faArrowsRotate,
    tone: LeadBadgeTone.Lime,
  },
  [ContactLeadStatus.NotReached]: {
    icon: faPhoneSlash,
    tone: LeadBadgeTone.Coral,
  },
  [ContactLeadStatus.Reminder]: {
    icon: faBell,
    tone: LeadBadgeTone.Fuchsia,
  },
  [ContactLeadStatus.Responded]: {
    icon: faReply,
    tone: LeadBadgeTone.Pink,
  },
  [ContactLeadStatus.SettingCall]: {
    icon: faCalendarCheck,
    tone: LeadBadgeTone.Indigo,
  },
  [ContactLeadStatus.ClosingCall]: {
    icon: faPhoneVolume,
    tone: LeadBadgeTone.Teal,
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

export function getLeadStatusBadgeTone(
  status: LeadStatusBadgeStatus,
): LeadBadgeToneValue {
  return STATUS_CONFIG[status].tone;
}

export function LeadStatusBadge({
  className,
  label,
  status,
}: LeadStatusBadgeProps) {
  const { icon } = STATUS_CONFIG[status];

  return (
    <LeadBadge
      className={className}
      icon={icon}
      kind={LeadBadgeKind.Status}
      label={label}
      tone={getLeadStatusBadgeTone(status)}
    />
  );
}
