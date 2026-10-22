import { isSupportedLocale } from "@/config/i18n";

const HOME_NAVIGATION_ITEM = "home";

export function getNavigationItem(href: string): string {
  const [pathPart = "", hashPart] = href.split("#");
  if (hashPart) {
    return hashPart;
  }

  const segments = (pathPart.split("?")[0] ?? "").split("/").filter(Boolean);
  const routeSegments =
    segments[0] && isSupportedLocale(segments[0])
      ? segments.slice(1)
      : segments;
  return routeSegments.at(-1) ?? HOME_NAVIGATION_ITEM;
}
