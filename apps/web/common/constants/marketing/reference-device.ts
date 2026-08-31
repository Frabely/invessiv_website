export const REFERENCE_DEVICE = {
  Browser: "browser",
  Phone: "phone",
} as const;

export type ReferenceDevice =
  (typeof REFERENCE_DEVICE)[keyof typeof REFERENCE_DEVICE];
