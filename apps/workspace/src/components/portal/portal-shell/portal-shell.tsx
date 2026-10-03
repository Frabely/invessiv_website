"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
import type { PortalShellDictionary } from "@/i18n/dictionaries/portal";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import styles from "./portal-shell.module.css";

type PortalShellProps = {
  children: ReactNode;
  content: PortalShellDictionary;
  /** Already formatted greeting of the contact; null in the owner view or without a first name. */
  greeting?: string | null;
  homeHref: string;
  projectSwitcher?: ReactNode;
  /** Optional notice shown inline in the header, e.g. the owner's read-only banner. */
  notice?: ReactNode | null;
  /**
   * The company link and optional company switcher, built by the caller.
   */
  switcher: ReactNode;
};

/**
 * Deliberately distinct from `WorkspaceShell`: no sidebar, no internal navigation areas, no
 * internal branding. A customer contact must never be able to mistake this for the internal
 * workspace.
 */
export function PortalShell({
  children,
  content,
  greeting = null,
  homeHref,
  projectSwitcher,
  notice = null,
  switcher,
}: PortalShellProps) {
  const headerContent = content.header;
  const { locale: activeLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const themeSwitchCopy =
    theme === "dark"
      ? { actionLabel: headerContent.themeSwitch.actionLabel.dark }
      : { actionLabel: headerContent.themeSwitch.actionLabel.light };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div
          className={styles.inner}
          data-has-notice={notice ? "true" : undefined}
        >
          <a
            aria-label={headerContent.brandHomeAriaLabel}
            className={styles.brand}
            href={homeHref}
          >
            <Image
              alt=""
              height={28}
              priority
              src="/brand/icon.png"
              width={28}
            />
          </a>
          <div className={styles.switcherSlot}>{switcher}</div>
          {notice ? <div className={styles.noticeSlot}>{notice}</div> : null}
          {greeting ? (
            <a className={styles.greeting} href={homeHref}>
              {greeting}
            </a>
          ) : null}
          <div
            aria-label={headerContent.userMenuLabel}
            className={styles.actions}
          >
            {projectSwitcher ? (
              <div className={styles.projectSlot}>{projectSwitcher}</div>
            ) : null}
            <ThemeSwitch
              copy={themeSwitchCopy}
              onToggle={toggleTheme}
              theme={theme}
            />
            <LocaleSwitch
              locale={activeLocale}
              localeMenuLabel={headerContent.localeMenuLabel}
              localeSwitchLabel={headerContent.localeSwitchLabel}
              onSelectAction={(nextLocale) => {
                const nextPathname = createLocalePathname(
                  window.location.pathname,
                  nextLocale,
                );
                window.location.assign(
                  `${nextPathname}${window.location.search}`,
                );
              }}
              variant="desktop"
            />
            <div className={styles.userButton}>
              <UserButton />
            </div>
          </div>
        </div>
      </header>
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
