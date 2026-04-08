export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "invessiv-theme";
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

export function resolveStoredTheme(
  value: string | null | undefined,
): Theme | null {
  return isTheme(value) ? value : null;
}
