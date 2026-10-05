/** Which control an option tile carries: one of several, or any number of them. */
export const OptionTileKind = {
  Radio: "radio",
  Checkbox: "checkbox",
} as const;

export type OptionTileKind =
  (typeof OptionTileKind)[keyof typeof OptionTileKind];

export const OPTION_TILE_KIND_VALUES = [
  OptionTileKind.Radio,
  OptionTileKind.Checkbox,
] as const;
