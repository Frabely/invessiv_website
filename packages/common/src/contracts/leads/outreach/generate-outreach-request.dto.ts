import type { OutreachChannel } from "@invessiv/common/constants/leads/outreach/lead-outreach-channels";

export interface GenerateOutreachRequestDto {
  leadId: string;
  channel: OutreachChannel;
  contextNote?: string;
}
