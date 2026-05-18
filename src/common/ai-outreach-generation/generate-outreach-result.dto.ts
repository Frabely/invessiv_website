import type { OutreachChannel } from "./outreach-channels";
import type { OutreachErrorCode } from "./outreach-error-codes";

export type GenerateOutreachResultDto =
  | {
      ok: true;
      channel: OutreachChannel;
      subject?: string;
      body: string;
    }
  | { ok: false; code: OutreachErrorCode };
