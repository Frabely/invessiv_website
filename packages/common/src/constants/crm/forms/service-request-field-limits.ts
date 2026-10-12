import { LineItemTemplateFieldLimits } from "./line-item-template-field-limits";

export const ServiceRequestFieldLimits = {
  TitleMaxLength: LineItemTemplateFieldLimits.TitleMaxLength,
  NoteMaxLength: 2000,
  DeclineReasonMaxLength: 500,
} as const;
