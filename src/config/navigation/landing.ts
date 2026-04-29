import type { NavigationItem } from "@/config/navigation/home";

export const LANDING_NAVIGATION: NavigationItem[] = [
  { href: "#solution" },
  { href: "#inclusions" },
  { href: "#audience" },
  { href: "#process" },
  { href: "#pricing" },
  { href: "#faq" },
];

export const LANDING_HEADER_NAVIGATION: NavigationItem[] =
  LANDING_NAVIGATION.filter((item) => item.href !== "#audience");
