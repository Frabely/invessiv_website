/** Color themes every Invessiv app offers; dark is the default. */
export const ColorTheme = {
  Dark: "dark",
  Light: "light",
} as const;

export type ColorTheme = (typeof ColorTheme)[keyof typeof ColorTheme];

export const COLOR_THEME_VALUES = [ColorTheme.Dark, ColorTheme.Light] as const;
