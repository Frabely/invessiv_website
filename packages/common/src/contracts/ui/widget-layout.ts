import type { WidgetColumnSpan } from "../../constants/ui/widget-column-spans";

export type WidgetResponsiveSpan = {
  /** Width used below the tablet breakpoint. */
  mobile: WidgetColumnSpan;
  /** Width used from 768px until the desktop breakpoint. */
  tablet: WidgetColumnSpan;
  /** Width used from 1100px onward; a quarter (3) stays a third until 1440px, where it fits. */
  desktop: WidgetColumnSpan;
};

export type WidgetLayoutEntry<Key extends string> = {
  /** Stable identifier used to match this position with its rendered slot. */
  key: Key;
  /** Explicit display order that leaves room for later entries. */
  order: number;
  /** Column widths in the shared twelve-column grid. */
  span: WidgetResponsiveSpan;
};
