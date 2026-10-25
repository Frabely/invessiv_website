/** Layout of a header control: compact in the desktop bar, full width in the mobile menu. */
export const HeaderControlVariant = {
  Desktop: "desktop",
  Mobile: "mobile",
} as const;

export type HeaderControlVariant =
  (typeof HeaderControlVariant)[keyof typeof HeaderControlVariant];

export const HEADER_CONTROL_VARIANT_VALUES = [
  HeaderControlVariant.Desktop,
  HeaderControlVariant.Mobile,
] as const;
