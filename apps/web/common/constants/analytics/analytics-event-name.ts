export const AnalyticsEventName = {
  SectionReached: "section_reached",
  PageEngaged: "page_engaged",
  CtaClicked: "cta_clicked",
  NavClicked: "nav_clicked",
  ContactChannelClicked: "contact_channel_clicked",
  OptionSelected: "option_selected",
  ReferenceOpened: "reference_opened",
  FaqOpened: "faq_opened",
  FormStarted: "form_started",
  FormSubmitted: "form_submitted",
  FormInvalid: "form_invalid",
  FormFailed: "form_failed",
  FormCompleted: "form_completed",
  LeadCreated: "lead_created",
  CalendarOpened: "calendar_opened",
  GeneratorStep: "generator_step",
  PreferenceChanged: "preference_changed",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEventName)[keyof typeof AnalyticsEventName];

export const ANALYTICS_EVENT_NAMES = Object.values(AnalyticsEventName);

export const ANALYTICS_MAX_EVENT_PROPERTIES = 2;
