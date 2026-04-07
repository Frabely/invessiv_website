"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { THEME_PROVIDER_MISSING_ERROR } from "@/components/providers/provider-errors";
import {
  DEFAULT_THEME,
  resolveStoredTheme,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getDocumentTheme(): Theme {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }

  const activeTheme = resolveStoredTheme(
    document.documentElement.dataset.theme,
  );
  return activeTheme ?? DEFAULT_THEME;
}

function persistTheme(nextTheme: Theme) {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  document.cookie = `${THEME_STORAGE_KEY}=${nextTheme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getDocumentTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
      },
      toggleTheme: () => {
        setThemeState((current) => (current === "dark" ? "light" : "dark"));
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(THEME_PROVIDER_MISSING_ERROR);
  }
  return context;
}
