"use client";

import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadPitchPanelVariant } from "@/common/constants/leads/pitch/lead-pitch-panel-variants";
import { LeadPitchPanel } from "@/components/workspace/leads/pitch/lead-pitch-panel/lead-pitch-panel";
import type { LeadsPitchDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-form-pitch-section.module.css";

type LeadFormPitchSectionProps = {
  content: LeadsPitchDictionary;
  lead: LeadDetailDto;
  onContactedAction: (status: ContactLeadStatus) => void;
};

export function LeadFormPitchSection({
  content,
  lead,
  onContactedAction,
}: LeadFormPitchSectionProps) {
  return (
    <div className={styles.wrapper}>
      <LeadPitchPanel
        content={content}
        lead={lead}
        onContactedAction={() => onContactedAction(ContactLeadStatus.Contacted)}
        variant={LeadPitchPanelVariant.Compact}
      />
    </div>
  );
}
