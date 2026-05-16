import type { OutreachChannel } from "./outreach-channels";
import type { OutreachErrorCode } from "./outreach-error-codes";
import type { OutreachPromptKey } from "./outreach-prompt-keys";

export type GenerateOutreachResultDto =
  | {
      ok: true;
      channel: OutreachChannel;
      promptKey: OutreachPromptKey;
      subject?: string;
      body: string;
    }
  | { ok: false; code: OutreachErrorCode };
