export const OutreachCopyTarget = {
  Body: "body",
  Subject: "subject",
} as const;

export type OutreachCopyTarget =
  (typeof OutreachCopyTarget)[keyof typeof OutreachCopyTarget];
