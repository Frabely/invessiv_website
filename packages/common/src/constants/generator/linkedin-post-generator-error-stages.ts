export const LinkedInPostGeneratorErrorStage = {
  RouteUnexpected: "route_unexpected",
  RouteUnknown: "route_unknown",
  UsageLimitReserve: "usage_limit_reserve",
  UsageLimitUnknown: "usage_limit_unknown",
} as const;

export type LinkedInPostGeneratorErrorStage =
  (typeof LinkedInPostGeneratorErrorStage)[keyof typeof LinkedInPostGeneratorErrorStage];
