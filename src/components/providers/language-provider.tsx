"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { ENABLE_THEME_SWITCH } from "@/config/site";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";

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

const getLocaleFromPath = (): Locale | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  return firstSegment === "de" || firstSegment === "en" ? firstSegment : null;
};

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE as Locale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [theme, setThemeState] = useState<Theme>("dark");
  const localeRef = useRef<Locale>(locale);
  const themeRef = useRef<Theme>(theme);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const localeFromPath = getLocaleFromPath();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const storedLocale = stored === "de" || stored === "en" ? stored : null;
    const resolvedLocale = localeFromPath ?? storedLocale ?? initialLocale;
    if (resolvedLocale === localeRef.current) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setLocaleState(resolvedLocale);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [initialLocale]);

  useEffect(() => {
    const resolvedTheme = (() => {
      if (!ENABLE_THEME_SWITCH) {
        return "dark" as Theme;
      }
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    })();
    if (resolvedTheme === themeRef.current) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setThemeState(resolvedTheme);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

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
      toggleLocale: () =>
        setLocaleState((current) => {
          if (current === "de") {
            return "en";
          }
          return "de";
        }),
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
