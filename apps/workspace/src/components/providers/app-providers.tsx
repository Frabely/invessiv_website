"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Theme } from "@/lib/theme/theme";

import { getClerkLocalization } from "@/i18n/clerk-localization";
import { createClerkAppearance } from "./clerk-appearance";

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
    <ClerkProvider
      appearance={createClerkAppearance()}
      localization={getClerkLocalization(initialLocale)}
    >
      <ThemeProvider initialTheme={initialTheme}>
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
