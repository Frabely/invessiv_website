export const OutreachCopyTarget = {
  Body: "body",
  Subject: "subject",
} as const;

export type OutreachCopyTarget =
  (typeof OutreachCopyTarget)[keyof typeof OutreachCopyTarget];

export const OUTREACH_COPY_TARGET_VALUES = [
  OutreachCopyTarget.Subject,
  OutreachCopyTarget.Body,
] as const;
