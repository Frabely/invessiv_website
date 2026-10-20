import type dictionary from "@/i18n/dictionaries/workspace/crm/feedback-rounds/de.json";

export type FeedbackTextDialogTexts = Omit<
  typeof dictionary.clarification.askDialog,
  "resultNotice"
>;
