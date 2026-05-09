"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
import type { Locale } from "@/config/i18n";
import { isSupportedLocale } from "@/config/i18n";
import type { AuthContent } from "@/i18n/dictionaries/auth";
import { REDIRECT_URL_QUERY_PARAM } from "@/lib/auth/routes";
import styles from "./auth-frame.module.css";

type AuthFrameProps = {
  children: ReactNode;
  content: AuthContent["frame"];
  locale: Locale;
};

function buildLocalePath(currentPath: string, nextLocale: Locale): string {
  const normalized = currentPath || "/";
  if (normalized === "/") {
    return `/${nextLocale}`;
  }
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] && isSupportedLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }
  return `/${nextLocale}${normalized}`;
}

export function localizeAuthRedirectSearch(
  currentSearch: string,
  nextLocale: Locale,
): string {
  const searchParams = new URLSearchParams(currentSearch);
  const redirectUrl = searchParams.get(REDIRECT_URL_QUERY_PARAM);

  if (redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")) {
    searchParams.set(
      REDIRECT_URL_QUERY_PARAM,
      buildLocalePath(redirectUrl, nextLocale),
    );
  }

  const nextSearch = searchParams.toString();
  return nextSearch ? `?${nextSearch}` : "";
}

export function AuthFrame({ children, content, locale }: AuthFrameProps) {
  const { setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const themeSwitchCopy = {
    actionLabel:
      theme === "dark"
        ? content.themeSwitch.actionLabel.dark
        : content.themeSwitch.actionLabel.light,
  };

  const handleLocaleSelect = (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const localeMenu = event.currentTarget.closest("details");
    if (nextLocale === locale) {
      localeMenu?.removeAttribute("open");
      return;
    }

    const nextPathname = buildLocalePath(pathname ?? "/", nextLocale);
    const search =
      typeof window !== "undefined"
        ? localizeAuthRedirectSearch(window.location.search, nextLocale)
        : "";
    const nextUrl = `${nextPathname}${search}`;

    setLocale(nextLocale);
    router.replace(nextUrl, { scroll: false });
    localeMenu?.removeAttribute("open");
  };

  return (
    <div className={styles.frame}>
      <header className={styles.topBar}>
        <a
          aria-label={content.brandHomeAriaLabel}
          className={styles.brand}
          href={`/${locale}`}
        >
          <Image
            alt={content.brandLogoAlt}
            height={26}
            priority
            src="/brand/icon.png"
            width={26}
          />
          <span>{content.brandLabel}</span>
        </a>
        <div aria-label={content.actionsAriaLabel} className={styles.actions}>
          <ThemeSwitch
            copy={themeSwitchCopy}
            onToggle={toggleTheme}
            theme={theme}
          />
          <LocaleSwitch
            locale={locale}
            localeMenuLabel={content.localeMenuLabel}
            localeSwitchLabel={content.localeSwitchLabel}
            onSelectAction={handleLocaleSelect}
            variant="desktop"
          />
        </div>
      </header>
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
