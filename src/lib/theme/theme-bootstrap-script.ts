import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme/theme";

export function createThemeBootstrapInlineScript() {
  return `(() => {
    const storageKey = "${THEME_STORAGE_KEY}";
    const defaultTheme = "${DEFAULT_THEME}";

    const applyTheme = (nextTheme) => {
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
    };

    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === "dark" || storedTheme === "light") {
        applyTheme(storedTheme);
        return;
      }
    } catch {}

    const preferredTheme = window.matchMedia("(prefers-color-scheme: light)")
      .matches
      ? "light"
      : defaultTheme;

    applyTheme(preferredTheme);
  })();`;
}
