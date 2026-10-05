/**
 * Sizes of a button beyond its default: `control` matches the height of form inputs, `icon` is a
 * square touch target for a button that shows only an icon.
 */
export const ButtonSize = {
  Default: "default",
  Control: "control",
  Icon: "icon",
} as const;

export type ButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

export const BUTTON_SIZE_VALUES = [
  ButtonSize.Default,
  ButtonSize.Control,
  ButtonSize.Icon,
] as const;
