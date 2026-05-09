"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { deDE, enUS } from "@clerk/localizations";
import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Theme } from "@/lib/theme/theme";

const clerkLocalizations: Record<Locale, typeof deDE> = {
  de: deDE,
  en: enUS,
};

type AppProvidersProps = {
  children: ReactNode;
  initialLocale: Locale;
  initialTheme: Theme;
};

export function AppProviders({
  children,
  initialLocale,
  initialTheme,
}: AppProvidersProps) {
  return (
    <ClerkProvider localization={clerkLocalizations[initialLocale]}>
      <ThemeProvider initialTheme={initialTheme}>
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
