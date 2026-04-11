import {
  CONTACT_BUDGET_KEYS,
  CONTACT_GOAL_KEYS,
  CONTACT_OFFER_KEYS,
  CONTACT_PAGE_KEYS,
  CONTACT_START_KEYS,
  CONTACT_WORKFLOW_KEYS,
} from "@/common/constants/contact/contact-options";

export type ContactOfferKey = (typeof CONTACT_OFFER_KEYS)[number];
export type ContactGoalKey = (typeof CONTACT_GOAL_KEYS)[number];
export type ContactPageKey = (typeof CONTACT_PAGE_KEYS)[number];
export type ContactWorkflowKey = (typeof CONTACT_WORKFLOW_KEYS)[number];
export type ContactBudgetKey = (typeof CONTACT_BUDGET_KEYS)[number];
export type ContactStartKey = (typeof CONTACT_START_KEYS)[number];
