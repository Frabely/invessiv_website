export const CONTACT_OFFER_KEYS = [
  "landing",
  "maintenance",
  "process",
  "upgrade",
  "web",
] as const;

export const CONTACT_GOAL_KEYS = [
  "generate_inquiries",
  "increase_bookings",
  "sell_product",
  "grow_newsletter",
] as const;

export const CONTACT_PAGE_KEYS = [
  "home",
  "services",
  "about",
  "contact",
  "careers",
  "blog",
  "landing_page",
  "other",
] as const;

export const CONTACT_WORKFLOW_KEYS = [
  "one_workflow",
  "two_workflows",
  "three_plus_workflows",
] as const;

export const CONTACT_BUDGET_KEYS = [
  "below_1000",
  "between_1000_2500",
  "between_2500_5000",
  "between_5000_10000",
  "above_10000",
  "open",
] as const;

export const CONTACT_START_KEYS = [
  "immediately",
  "within_two_weeks",
  "within_one_month",
  "later_flexible",
] as const;

export type ContactOfferKey = (typeof CONTACT_OFFER_KEYS)[number];
export type ContactGoalKey = (typeof CONTACT_GOAL_KEYS)[number];
export type ContactPageKey = (typeof CONTACT_PAGE_KEYS)[number];
export type ContactWorkflowKey = (typeof CONTACT_WORKFLOW_KEYS)[number];
export type ContactBudgetKey = (typeof CONTACT_BUDGET_KEYS)[number];
export type ContactStartKey = (typeof CONTACT_START_KEYS)[number];
