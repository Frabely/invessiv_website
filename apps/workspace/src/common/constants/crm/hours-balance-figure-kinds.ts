export const HoursBalanceFigureKind = {
  Purchased: "purchased",
  Used: "used",
  Allocated: "allocated",
  Free: "free",
  Goodwill: "goodwill",
  Remaining: "remaining",
} as const;

export type HoursBalanceFigureKind =
  (typeof HoursBalanceFigureKind)[keyof typeof HoursBalanceFigureKind];
