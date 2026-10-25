"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  LocaleSwitch,
  ThemeSwitch,
} from "@invessiv/ui";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import type { PortalShellDictionary } from "@/i18n/dictionaries/portal";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import styles from "./portal-shell.module.css";

type PortalShellProps = {
  children: ReactNode;
  content: PortalShellDictionary;
  /** Already formatted greeting of the contact; null in the owner view or without a first name. */
  greeting?: string | null;
  homeHref: string;
  /** Left out when there is no other project to switch to, so the menu shows no empty line. */
  projectSwitcher?: ReactNode;
  /** Optional notice shown inline in the header, e.g. the owner's read-only banner. */
  notice?: ReactNode | null;
  /**
   * The company link and optional company switcher, built by the caller.
   */
  switcher: ReactNode;
  /**
   * More than one company to choose from. Only then does the phone menu repeat the switcher; with
   * a single company it is just the name, and the logo already leads to the same overview.
   */
  switcherHasChoice?: boolean;
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
  switcherHasChoice = false,
}: PortalShellProps) {
  const headerContent = content.header;
  const { locale: activeLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const themeSwitchCopy =
    theme === "dark"
      ? { actionLabel: headerContent.themeSwitch.actionLabel.dark }
      : { actionLabel: headerContent.themeSwitch.actionLabel.light };
  const themeSwitch = (
    <ThemeSwitch copy={themeSwitchCopy} onToggle={toggleTheme} theme={theme} />
  );
  const localeSwitch = (
    <LocaleSwitch
      locale={activeLocale}
      localeMenuLabel={headerContent.localeMenuLabel}
      localeSwitchLabel={headerContent.localeSwitchLabel}
      onSelectAction={(nextLocale) => {
        const nextPathname = createLocalePathname(
          window.location.pathname,
          nextLocale,
        );
        window.location.assign(`${nextPathname}${window.location.search}`);
      }}
      variant="desktop"
    />
  );

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
              src="/brand/invessiv-logo.svg"
              width={33}
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
            <div className={styles.preferences}>
              {themeSwitch}
              {localeSwitch}
            </div>
            <div className={styles.userButton}>
              <UserButton />
            </div>
            <ButtonControl
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-label={headerContent.menuOpenLabel}
              className={styles.menuButton}
              onClick={() => setMenuOpen(true)}
              size={ButtonSize.Icon}
              type="button"
              variant="quiet"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faBars} />
            </ButtonControl>
          </div>
        </div>
      </header>
      {menuOpen ? (
        <Dialog
          closeLabel={headerContent.menuCloseLabel}
          onCloseAction={() => setMenuOpen(false)}
          size={DialogSize.Narrow}
          title={headerContent.menuTitle}
        >
          <div className={styles.menu}>
            {notice}
            {switcherHasChoice ? (
              <MenuRow label={headerContent.menuCompany}>{switcher}</MenuRow>
            ) : null}
            {projectSwitcher ? (
              <MenuRow label={headerContent.menuProject}>
                {projectSwitcher}
              </MenuRow>
            ) : null}
            <MenuRow label={headerContent.menuTheme}>{themeSwitch}</MenuRow>
            <MenuRow label={headerContent.menuLanguage}>{localeSwitch}</MenuRow>
          </div>
        </Dialog>
      ) : null}
      <main className={styles.main} id="main-content">
        {children}
      </main>
    </div>
  );
}

/** A labelled line in the phone menu: what it sets on the left, the control on the right. */
function MenuRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className={styles.menuRow}>
      <span>{label}</span>
      {children}
    </div>
  );
}
