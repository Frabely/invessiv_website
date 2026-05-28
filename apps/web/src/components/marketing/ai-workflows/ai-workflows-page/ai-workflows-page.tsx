import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import type { Locale } from "@/config/i18n";
import { FOOTER_SECTION_ID } from "@/config/navigation/home";
import {
  AI_WORKFLOWS_HEADER_NAVIGATION,
  AI_WORKFLOWS_SECTION_HREFS,
} from "@/config/navigation/ai-workflows";
import { getLandingFooterContent } from "@/i18n/dictionaries/landing/footer";

type AiWorkflowsPageProps = {
  locale: Locale;
};

export function AiWorkflowsPage({ locale }: AiWorkflowsPageProps) {
  const footer = getLandingFooterContent(locale);

  return (
    <>
      <AnchorOffsetScroll />
      <SiteHeader
        ctaHref={AI_WORKFLOWS_SECTION_HREFS.contact}
        navigation={AI_WORKFLOWS_HEADER_NAVIGATION}
        showThemeSwitch={false}
      />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        {/* Sections werden in Tasks A1–A6 ergänzt */}

        <FooterSection
          bottomNote={footer.bottomNote}
          brand={footer.brand}
          columns={footer.columns}
          copyright={footer.copyright}
          description={footer.description}
          id={FOOTER_SECTION_ID}
          legalLinks={footer.legalLinks}
          socialLinks={footer.socialLinks}
        />
      </main>
    </>
  );
}
