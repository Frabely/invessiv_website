/**
 * The colour a widget wears on its tab, count and frame. App-neutral hue names; the consuming app
 * defines one `--widget-accent-<value>` token per value for each theme.
 */
export const WidgetAccent = {
  Blue: "blue",
  Sky: "sky",
  Teal: "teal",
  Green: "green",
  Lime: "lime",
  Gold: "gold",
  Orange: "orange",
  Coral: "coral",
  Rose: "rose",
  Violet: "violet",
  Indigo: "indigo",
} as const;

export type WidgetAccent = (typeof WidgetAccent)[keyof typeof WidgetAccent];

export const WIDGET_ACCENT_VALUES = [
  WidgetAccent.Blue,
  WidgetAccent.Sky,
  WidgetAccent.Teal,
  WidgetAccent.Green,
  WidgetAccent.Lime,
  WidgetAccent.Gold,
  WidgetAccent.Orange,
  WidgetAccent.Coral,
  WidgetAccent.Rose,
  WidgetAccent.Violet,
  WidgetAccent.Indigo,
] as const;
