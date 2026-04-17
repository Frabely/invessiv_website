import { CONTACT_BUDGET_KEYS } from "@/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEYS } from "@/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEYS } from "@/common/constants/contact/contact-offer-keys";
import { CONTACT_PAGE_KEYS } from "@/common/constants/contact/contact-page-keys";
import { CONTACT_START_KEYS } from "@/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEYS } from "@/common/constants/contact/contact-workflow-keys";

export type ContactOfferKey = (typeof CONTACT_OFFER_KEYS)[number];
export type ContactGoalKey = (typeof CONTACT_GOAL_KEYS)[number];
export type ContactPageKey = (typeof CONTACT_PAGE_KEYS)[number];
export type ContactWorkflowKey = (typeof CONTACT_WORKFLOW_KEYS)[number];
export type ContactBudgetKey = (typeof CONTACT_BUDGET_KEYS)[number];
export type ContactStartKey = (typeof CONTACT_START_KEYS)[number];
