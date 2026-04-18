export const CONTACT_GOAL_KEY = {
  GenerateInquiries: "generate_inquiries",
  GrowNewsletter: "grow_newsletter",
  IncreaseBookings: "increase_bookings",
  OtherGoal: "other_goal",
  SellProduct: "sell_product",
} as const;

export const CONTACT_GOAL_KEYS = [
  CONTACT_GOAL_KEY.GenerateInquiries,
  CONTACT_GOAL_KEY.IncreaseBookings,
  CONTACT_GOAL_KEY.SellProduct,
  CONTACT_GOAL_KEY.GrowNewsletter,
  CONTACT_GOAL_KEY.OtherGoal,
] as const;

export type ContactGoalKey = (typeof CONTACT_GOAL_KEYS)[number];
