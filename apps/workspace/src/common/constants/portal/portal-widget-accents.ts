import { WidgetAccent } from "@invessiv/common/constants/ui/widget-accents";
import { PortalWidgetKey } from "./portal-widget-keys";

/**
 * Every dashboard card wears its own colour, so cards are told apart at a glance. A new widget key
 * fails to compile here until it gets one; the test keeps two cards from sharing a colour.
 */
export const PORTAL_WIDGET_ACCENTS: Record<PortalWidgetKey, WidgetAccent> = {
  [PortalWidgetKey.Onboarding]: WidgetAccent.Violet,
  [PortalWidgetKey.Project]: WidgetAccent.Blue,
  [PortalWidgetKey.CustomerTasks]: WidgetAccent.Coral,
  [PortalWidgetKey.OurTasks]: WidgetAccent.Gold,
  [PortalWidgetKey.Feedback]: WidgetAccent.Rose,
  [PortalWidgetKey.Hours]: WidgetAccent.Teal,
  [PortalWidgetKey.Contact]: WidgetAccent.Green,
  [PortalWidgetKey.Files]: WidgetAccent.Sky,
  [PortalWidgetKey.Credentials]: WidgetAccent.Indigo,
  [PortalWidgetKey.ServiceRequest]: WidgetAccent.Orange,
  [PortalWidgetKey.CompletedProjects]: WidgetAccent.Lime,
};
