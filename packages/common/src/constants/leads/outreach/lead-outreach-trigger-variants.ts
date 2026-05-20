export const LeadOutreachTriggerVariant = {
  IconOnly: "icon-only",
  IconText: "icon+text",
} as const;

export type LeadOutreachTriggerVariant =
  (typeof LeadOutreachTriggerVariant)[keyof typeof LeadOutreachTriggerVariant];

export const LEAD_OUTREACH_TRIGGER_VARIANT_VALUES = [
  LeadOutreachTriggerVariant.IconOnly,
  LeadOutreachTriggerVariant.IconText,
] as const;
