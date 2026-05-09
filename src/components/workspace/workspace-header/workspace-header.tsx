"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { WorkspaceSearch } from "@/components/workspace/workspace-search/workspace-search";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
import type { Locale } from "@/config/i18n";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import styles from "./workspace-header.module.css";

type WorkspaceHeaderProps = {
  content: WorkspacePageContent;
  isMobileMenuOpen: boolean;
  locale: Locale;
  onMobileMenuToggleAction: () => void;
};

export function WorkspaceHeader({
  content,
  isMobileMenuOpen,
  locale,
  onMobileMenuToggleAction,
}: WorkspaceHeaderProps) {
  const headerContent = content.shell.header;
  const { locale: activeLocale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceHref = `/${locale}/workspace`;
  const themeSwitchCopy =
    theme === "dark"
      ? { actionLabel: headerContent.themeSwitch.actionLabel.dark }
      : { actionLabel: headerContent.themeSwitch.actionLabel.light };

  const handleLocaleSelect = (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const localeMenu = event.currentTarget.closest("details");
    if (nextLocale === activeLocale) {
      localeMenu?.removeAttribute("open");
      return;
    }

    const nextPathname = createLocalePathname(
      pathname || workspaceHref,
      nextLocale,
    );
    const search = typeof window !== "undefined" ? window.location.search : "";

    setLocale(nextLocale);
    router.replace(`${nextPathname}${search}`, { scroll: false });
    localeMenu?.removeAttribute("open");
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.leftCluster}>
          <button
            aria-expanded={isMobileMenuOpen}
            aria-label={
              isMobileMenuOpen
                ? headerContent.mobileMenuCloseLabel
                : headerContent.mobileMenuOpenLabel
            }
            className={styles.menuButton}
            data-open={isMobileMenuOpen ? "true" : "false"}
            onClick={onMobileMenuToggleAction}
            type="button"
          >
            <span aria-hidden="true" className={styles.menuIcon}>
              <span className={styles.menuIconLine} />
              <span className={styles.menuIconLine} />
              <span className={styles.menuIconLine} />
            </span>
          </button>

          <a
            aria-label={headerContent.brandHomeAriaLabel}
            className={styles.brand}
            href={workspaceHref}
          >
            <span className={styles.brandMark}>
              <Image
                alt={headerContent.brandLogoAlt}
                height={26}
                priority
                src="/brand/icon.png"
                width={26}
              />
            </span>
            <span className={styles.brandLabel}>
              {headerContent.brandLabel}
            </span>
          </a>
        </div>

        <div className={styles.searchSlot}>
          <WorkspaceSearch content={headerContent.search} />
        </div>

        <div
          className={styles.actions}
          aria-label={headerContent.userMenuLabel}
        >
          <ThemeSwitch
            className={styles.themeSwitch}
            copy={themeSwitchCopy}
            onToggle={toggleTheme}
            theme={theme}
          />
          <LocaleSwitch
            locale={activeLocale}
            localeMenuLabel={headerContent.localeMenuLabel}
            localeSwitchLabel={headerContent.localeSwitchLabel}
            onSelectAction={handleLocaleSelect}
            variant="desktop"
          />
          <div className={styles.userButton}>
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
