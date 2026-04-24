"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CustomCursor } from "@/components/shared/custom-cursor/custom-cursor";
import type { Theme } from "@/lib/theme/theme";

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
    <ThemeProvider initialTheme={initialTheme}>
      <LanguageProvider initialLocale={initialLocale}>
        {children}
        <CustomCursor />
      </LanguageProvider>
    </ThemeProvider>
  );
}
