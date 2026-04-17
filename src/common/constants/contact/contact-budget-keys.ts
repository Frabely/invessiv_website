export const CONTACT_BUDGET_KEY = {
  Above10000: "above_10000",
  Below1000: "below_1000",
  Between1000And2500: "between_1000_2500",
  Between2500And5000: "between_2500_5000",
  Between5000And10000: "between_5000_10000",
  Open: "open",
} as const;

export const CONTACT_BUDGET_KEYS = [
  CONTACT_BUDGET_KEY.Below1000,
  CONTACT_BUDGET_KEY.Between1000And2500,
  CONTACT_BUDGET_KEY.Between2500And5000,
  CONTACT_BUDGET_KEY.Between5000And10000,
  CONTACT_BUDGET_KEY.Above10000,
  CONTACT_BUDGET_KEY.Open,
] as const;

export type ContactBudgetKey = (typeof CONTACT_BUDGET_KEYS)[number];
