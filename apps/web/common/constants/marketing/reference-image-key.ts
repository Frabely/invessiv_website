export const REFERENCE_IMAGE_KEY = {
  Allmacher: "allmacher",
  Kolja: "kolja",
  Consumption: "consumption",
} as const;

export type ReferenceImageKey =
  (typeof REFERENCE_IMAGE_KEY)[keyof typeof REFERENCE_IMAGE_KEY];
