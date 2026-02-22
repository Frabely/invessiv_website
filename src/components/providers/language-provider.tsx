"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { ENABLE_THEME_SWITCH } from "@/config/site";

type Theme = "dark" | "light";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "invessiv-locale";
const THEME_STORAGE_KEY = "invessiv-theme";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "de" ? "de" : "en";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!ENABLE_THEME_SWITCH) {
      return "dark";
    }
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const activeTheme: Theme = ENABLE_THEME_SWITCH ? theme : "dark";
    if (ENABLE_THEME_SWITCH) {
      window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    }
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme;
  }, [theme]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => setLocaleState(nextLocale),
      toggleLocale: () => setLocaleState((current) => (current === "de" ? "en" : "de")),
      theme,
      setTheme: (nextTheme) => {
        if (!ENABLE_THEME_SWITCH) {
          return;
        }
        setThemeState(nextTheme);
      },
      toggleTheme: () => {
        if (!ENABLE_THEME_SWITCH) {
          return;
        }
        setThemeState((current) => (current === "dark" ? "light" : "dark"));
      },
    }),
    [locale, theme],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
