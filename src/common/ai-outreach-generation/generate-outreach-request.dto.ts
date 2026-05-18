import type { OutreachChannel } from "./outreach-channels";

export interface GenerateOutreachRequestDto {
  leadId: string;
  channel: OutreachChannel;
  contextNote?: string;
}
