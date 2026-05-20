import type { Locale } from "@/config/i18n";

export function createLocalePathname(
  pathname: string | null | undefined,
  nextLocale: Locale,
): string {
  const normalizedPath = pathname || "/";
  if (normalizedPath === "/") {
    return `/${nextLocale}`;
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments[0] === "de" || segments[0] === "en") {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}${normalizedPath}`;
}
