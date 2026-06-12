"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import { THEME_PROVIDER_MISSING_ERROR } from "@invessiv/common/constants/providers/provider-errors";
import {
  DEFAULT_THEME,
  resolveStoredTheme,
  type Theme,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_STORAGE_KEY,
} from "@/lib/theme/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeInitialContext = createContext<Theme | null>(null);

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  return (
    <ThemeInitialContext.Provider value={initialTheme}>
      <NextThemesProvider
        attribute="data-theme"
        defaultTheme={initialTheme}
        disableTransitionOnChange
        enableColorScheme
        enableSystem={false}
        storageKey={THEME_STORAGE_KEY}
        themes={["dark", "light"]}
      >
        {children}
      </NextThemesProvider>
    </ThemeInitialContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const { resolvedTheme, setTheme } = useNextTheme();
  const initialTheme = useContext(ThemeInitialContext);
  if (!initialTheme) {
    throw new Error(THEME_PROVIDER_MISSING_ERROR);
  }

  const documentTheme =
    typeof document === "undefined"
      ? null
      : resolveStoredTheme(document.documentElement.dataset.theme);
  const theme =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : (documentTheme ?? initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }, [theme]);

  return {
    theme,
    setTheme: (nextTheme) => {
      setTheme(nextTheme);
    },
    toggleTheme: () => {
      setTheme(theme === "dark" ? "light" : "dark");
    },
  };
}
