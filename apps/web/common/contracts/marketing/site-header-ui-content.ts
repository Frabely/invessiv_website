import type { SiteHeaderContent } from "@/common/contracts/marketing/site-header-content";

export type SiteHeaderUiContent = SiteHeaderContent & {
  skipLinkLabel: string;
  themeSwitch: {
    actionLabel: {
      dark: string;
      light: string;
    };
  };
};
