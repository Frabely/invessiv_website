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
  type ContactLeadStatus as ContactLeadStatusValue,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadBadgeKind } from "@invessiv/common/constants/leads/badges/lead-badge-kinds";
import { LEAD_STATUS_BADGE_TONES } from "@/common/constants/leads/badges/lead-status-badge-tones";
import { LeadBadge } from "../lead-badge/lead-badge";

type LeadStatusBadgeStatus =
  | ContactLeadStatusValue
  | typeof CONTACT_LEAD_STATUS_ALL;

type LeadStatusBadgeProps = {
  className?: string;
  label: string;
  status: LeadStatusBadgeStatus;
};

const STATUS_ICONS: Record<LeadStatusBadgeStatus, IconDefinition> = {
  [CONTACT_LEAD_STATUS_ALL]: faLayerGroup,
  [ContactLeadStatus.New]: faCirclePlus,
  [ContactLeadStatus.PendingReview]: faHourglassHalf,
  [ContactLeadStatus.Contacted]: faComments,
  [ContactLeadStatus.ConnectionRequested]: faUserPlus,
  [ContactLeadStatus.Connected]: faHandshake,
  [ContactLeadStatus.FollowUp]: faArrowsRotate,
  [ContactLeadStatus.NotReached]: faPhoneSlash,
  [ContactLeadStatus.Reminder]: faBell,
  [ContactLeadStatus.Responded]: faReply,
  [ContactLeadStatus.SettingCall]: faCalendarCheck,
  [ContactLeadStatus.ClosingCall]: faPhoneVolume,
  [ContactLeadStatus.Qualified]: faCircleCheck,
  [ContactLeadStatus.Proposal]: faFileSignature,
  [ContactLeadStatus.OnHold]: faCirclePause,
  [ContactLeadStatus.Won]: faTrophy,
  [ContactLeadStatus.Lost]: faCircleXmark,
  [ContactLeadStatus.Archived]: faArchive,
};

export function LeadStatusBadge({
  className,
  label,
  status,
}: LeadStatusBadgeProps) {
  return (
    <LeadBadge
      className={className}
      icon={STATUS_ICONS[status]}
      kind={LeadBadgeKind.Status}
      label={label}
      tone={LEAD_STATUS_BADGE_TONES[status]}
    />
  );
}
