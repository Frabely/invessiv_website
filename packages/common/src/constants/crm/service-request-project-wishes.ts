export const ServiceRequestProjectWish = {
  Existing: "existing",
  New: "new",
  Undecided: "undecided",
} as const;
export type ServiceRequestProjectWish =
  (typeof ServiceRequestProjectWish)[keyof typeof ServiceRequestProjectWish];
export const SERVICE_REQUEST_PROJECT_WISH_VALUES = [
  ServiceRequestProjectWish.Existing,
  ServiceRequestProjectWish.New,
  ServiceRequestProjectWish.Undecided,
] as const;
