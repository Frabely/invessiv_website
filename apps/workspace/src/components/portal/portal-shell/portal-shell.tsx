"use client";

import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
import type { Locale } from "@/config/i18n";
import type { PortalShellDictionary } from "@/i18n/dictionaries/portal";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { portalEntryPathFor } from "@/lib/auth/routes";
import styles from "./portal-shell.module.css";

type PortalShellProps = {
  children: ReactNode;
  content: PortalShellDictionary;
  locale: Locale;
  /** Rendered only once a portal module registers an entry in `PORTAL_NAV_ITEMS`. */
  nav?: ReactNode | null;
  /** Full-width notice below the header, e.g. the owner's read-only banner. */
  notice?: ReactNode | null;
  /** Built by the caller from the actor's active memberships — kept out of this client shell. */
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
  locale,
  nav = null,
  notice = null,
  switcher,
}: PortalShellProps) {
  const headerContent = content.header;
  const { locale: activeLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const entryHref = portalEntryPathFor(locale);
  const themeSwitchCopy =
    theme === "dark"
      ? { actionLabel: headerContent.themeSwitch.actionLabel.dark }
      : { actionLabel: headerContent.themeSwitch.actionLabel.light };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <a
            aria-label={headerContent.brandHomeAriaLabel}
            className={styles.brand}
            href={entryHref}
          >
            {headerContent.brandLabel}
          </a>
          <div className={styles.switcherSlot}>{switcher}</div>
          <div
            aria-label={headerContent.userMenuLabel}
            className={styles.actions}
          >
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
      {notice}
      {nav ? (
        <nav aria-label={content.nav.ariaLabel} className={styles.nav}>
          {nav}
        </nav>
      ) : null}
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}
