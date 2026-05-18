import { OutreachChannel } from "./outreach-channels";

export const OUTREACH_DEFAULT_CHANNEL = OutreachChannel.Linkedin;
export const OUTREACH_CONTEXT_NOTE_MAX_LEN = 200;
export const OUTREACH_MAX_IMPROVEMENTS = 2;
export const OUTREACH_DEFAULT_OWNER_FALLBACK = "Moritz";
export const OUTREACH_CONTEXT_NOTE_ROWS = 4;
export const OUTREACH_RESULT_TEXTAREA_ROWS = {
  Default: 14,
  Email: 11,
} as const;
export const OUTREACH_COPY_FEEDBACK_MS = 1600;
