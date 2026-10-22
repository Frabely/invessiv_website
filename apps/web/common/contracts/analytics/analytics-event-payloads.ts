import type { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import type { AnalyticsArea } from "@/common/constants/analytics/analytics-area";
import type { AnalyticsContactChannel } from "@/common/constants/analytics/analytics-contact-channel";
import type { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import type {
  AnalyticsCalendarSource,
  AnalyticsFormFailureReason,
  AnalyticsFormId,
  AnalyticsFormPlacement,
} from "@/common/constants/analytics/analytics-form";
import type { AnalyticsGeneratorStep } from "@/common/constants/analytics/analytics-generator-step";
import type { AnalyticsOptionGroup } from "@/common/constants/analytics/analytics-option-group";
import type { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import type { AnalyticsPreferenceType } from "@/common/constants/analytics/analytics-preference-type";
import type { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";

export type SectionReachedPayload = {
  page: AnalyticsPage;
  section: string;
};

export type PageEngagedPayload = {
  page: AnalyticsPage;
};

export type CtaClickedPayload = {
  cta: AnalyticsCtaId;
  target: AnalyticsTarget;
};

export type NavClickedPayload = {
  item: string;
  area: AnalyticsArea;
};

export type ContactChannelClickedPayload = {
  channel: AnalyticsContactChannel;
  area: AnalyticsArea;
};

export type OptionSelectedPayload = {
  group: AnalyticsOptionGroup;
  option: string;
};

export type ReferenceOpenedPayload = {
  project: string;
  target: AnalyticsTarget;
};

export type FaqOpenedPayload = {
  page: AnalyticsPage;
  question: string;
};

export type FormContextPayload = {
  form: AnalyticsFormId;
  placement: AnalyticsFormPlacement;
};

export type FormInvalidPayload = {
  form: AnalyticsFormId;
  field: string;
};

export type FormFailedPayload = {
  form: AnalyticsFormId;
  reason: AnalyticsFormFailureReason;
};

export type LeadCreatedPayload = {
  form: AnalyticsFormId;
  origin: ContactSubmissionOrigin;
};

export type CalendarOpenedPayload = {
  source: AnalyticsCalendarSource;
  placement: AnalyticsFormPlacement | AnalyticsCtaId;
};

export type GeneratorStepPayload = {
  step: AnalyticsGeneratorStep;
  reason?: string;
};

export type PreferenceChangedPayload = {
  type: AnalyticsPreferenceType;
  value: string;
};

export type AnalyticsEventPayloadMap = {
  section_reached: SectionReachedPayload;
  page_engaged: PageEngagedPayload;
  cta_clicked: CtaClickedPayload;
  nav_clicked: NavClickedPayload;
  contact_channel_clicked: ContactChannelClickedPayload;
  option_selected: OptionSelectedPayload;
  reference_opened: ReferenceOpenedPayload;
  faq_opened: FaqOpenedPayload;
  form_started: FormContextPayload;
  form_submitted: FormContextPayload;
  form_invalid: FormInvalidPayload;
  form_failed: FormFailedPayload;
  form_completed: FormContextPayload;
  lead_created: LeadCreatedPayload;
  calendar_opened: CalendarOpenedPayload;
  generator_step: GeneratorStepPayload;
  preference_changed: PreferenceChangedPayload;
};

export type AnalyticsEventProperties = Record<string, string>;
