import type { OutreachChannel } from "@invessiv/common/constants/leads/outreach/lead-outreach-channels";
import type { OutreachErrorCode } from "@invessiv/common/constants/leads/outreach/lead-outreach-error-codes";

export type GenerateOutreachResultDto =
  | {
      ok: true;
      channel: OutreachChannel;
      subject?: string;
      body: string;
    }
  | { ok: false; code: OutreachErrorCode };
