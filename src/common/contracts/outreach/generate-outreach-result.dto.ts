import type { OutreachChannel } from "@/common/constants/outreach/outreach-channels";
import type { OutreachErrorCode } from "@/common/constants/outreach/outreach-error-codes";
import type { OutreachPromptKey } from "@/common/constants/outreach/outreach-prompt-keys";

export type GenerateOutreachResultDto =
  | {
      ok: true;
      channel: OutreachChannel;
      promptKey: OutreachPromptKey;
      subject?: string;
      body: string;
    }
  | { ok: false; code: OutreachErrorCode };
