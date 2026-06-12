"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/config/i18n";
import { LANGUAGE_PROVIDER_MISSING_ERROR } from "@invessiv/common/constants/providers/provider-errors";
import {
  LOCALE_SCROLL_RESTORE_STORAGE_KEY,
  matchesLocaleScrollRestoreState,
  parseLocaleScrollRestoreState,
} from "@/lib/navigation/locale-scroll-restoration";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "invessiv-locale";

const getLocaleFromPathname = (pathname: string | null): Locale | null => {
  if (!pathname) {
    return null;
  }
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment === "de" || firstSegment === "en" ? firstSegment : null;
};

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE as Locale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const pathnameLocale = getLocaleFromPathname(pathname);
  const [localOverride, setLocalOverride] = useState<Locale | null>(null);

  const locale = pathnameLocale ?? localOverride ?? initialLocale;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const restoreState = parseLocaleScrollRestoreState(
      window.sessionStorage.getItem(LOCALE_SCROLL_RESTORE_STORAGE_KEY),
    );
    if (!restoreState) {
      return;
    }

    if (!matchesLocaleScrollRestoreState(restoreState, window.location)) {
      return;
    }

    window.sessionStorage.removeItem(LOCALE_SCROLL_RESTORE_STORAGE_KEY);

    const restoreScrollPosition = () => {
      window.scrollTo(restoreState.x, restoreState.y);
    };

    restoreScrollPosition();
    window.requestAnimationFrame(restoreScrollPosition);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restoreScrollPosition);
    });
  }, [pathname]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => setLocalOverride(nextLocale),
      toggleLocale: () =>
        setLocalOverride((current) => {
          const activeLocale = current ?? locale;
          return activeLocale === "de" ? "en" : "de";
        }),
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(LANGUAGE_PROVIDER_MISSING_ERROR);
  }
  return context;
}
