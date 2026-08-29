"use client";

import { useRef } from "react";

import { CANONICAL_CONTACT_OFFER_KEY_BY_GROUP } from "@/common/constants/marketing";
import { ContactSection } from "@/components/marketing/home/sections/contact-section/contact-section";
import { FooterSection } from "@/components/marketing/home/sections/footer-section/footer-section";
import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";
import { HomeHeroPhoto } from "@/components/marketing/home/sections/hero-section/home-hero-photo/home-hero-photo";
import { ProcessSection } from "@/components/marketing/home/sections/process-section/process-section";
import { ProofSection } from "@/components/marketing/home/sections/proof-section/proof-section";
import { QAndASection } from "@/components/marketing/home/sections/q-and-a-section/q-and-a-section";
import { ServicesSection } from "@/components/marketing/home/sections/services-section/services-section";
import { ProblemSection } from "@/components/marketing/home/sections/problem-section/problem-section";
import { AnchorOffsetScroll } from "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll";
import { LayoutShell } from "@/components/marketing/shared/layout-shell/layout-shell";
import { SiteHeader } from "@/components/marketing/site-header/site-header";
import { useLanguage } from "@/components/providers/language-provider";
import {
  CONTACT_SECTION_ID,
  FAQ_SECTION_ID,
  FOOTER_SECTION_ID,
  HERO_SECTION_ID,
  PRIMARY_NAVIGATION,
  PRIMARY_NAVIGATION_SECTION_IDS,
  PROBLEM_SECTION_ID,
  PROCESS_SECTION_ID,
  PROOF_SECTION_ID,
  SECTION_HREFS,
  SECTION_IDS,
  SERVICES_SECTION_ID,
} from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import {
  getHomeSections,
  type HomeSectionContent,
} from "@/i18n/dictionaries/marketing/home";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { useServicesCardReveal } from "@/hooks/marketing/use-services-card-reveal";
import { getHomeFooterSectionContent } from "@/lib/navigation/home-footer-section";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { validateNavigationSections } from "@/lib/navigation/validate-navigation-sections";

type HomePageProps = {
  showProofSection: boolean;
};

export function HomePage({ showProofSection }: HomePageProps) {
  const { locale } = useLanguage();
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const sections = getHomeSections(locale);
  const ui = getHomeUiContent(locale);
  type ContentSectionId = HomeSectionContent["id"];
  const getSectionById = <Id extends ContentSectionId>(sectionId: Id) =>
    sections.find(
      (section): section is Extract<HomeSectionContent, { id: Id }> =>
        section.id === sectionId,
    );
  const heroSection = getSectionById(HERO_SECTION_ID);
  const servicesSection = getSectionById(SERVICES_SECTION_ID);
  const footerSection = getHomeFooterSectionContent(locale);
  const landingPageServiceHref = createLocalePathname(
    SITE_ROUTES.LANDING_PAGE_SERVICE,
    locale,
  );
  const validation = validateNavigationSections({
    navigationHrefs: PRIMARY_NAVIGATION.map((item) => item.href),
    sectionIds: [...PRIMARY_NAVIGATION_SECTION_IDS],
  });

  useServicesCardReveal(servicesSectionRef, locale);

  if (!heroSection || !servicesSection || !footerSection) {
    throw new Error("Expected home sections to be available.");
  }

  return (
    <>
      <AnchorOffsetScroll />
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main className="marketing-main" id="main-content" tabIndex={-1}>
        <div aria-hidden="true" className="page-accents">
          <span className="page-noise" />
        </div>

        <HeroSection
          description={heroSection.description}
          fullscreenVisual
          heroPrimaryCta={ui.heroPrimaryCta}
          heroSecondaryCta={ui.heroSecondaryCta}
          heroTag={ui.heroTag}
          heroTrustChips={ui.heroTrustChips}
          primaryCtaAnalyticsTarget="form"
          primaryCtaHref={SECTION_HREFS.contact}
          secondaryCtaAnalyticsTarget="services"
          secondaryCtaHref={SECTION_HREFS.services}
          title={heroSection.title}
          trackingLocation="hero"
          visualSlot={<HomeHeroPhoto alt={ui.heroVisualAriaLabel} />}
        />

        <LayoutShell>
          {!validation.hasCompleteMapping ? (
            <p
              className="mb-6 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-950"
              role="status"
            >
              {ui.mappingWarning}
            </p>
          ) : null}

          {SECTION_IDS.filter(
            (id) => id !== HERO_SECTION_ID && id !== FOOTER_SECTION_ID,
          ).map((id) => {
            if (id === PROBLEM_SECTION_ID) {
              return (
                <ProblemSection content={ui.problemContent} id={id} key={id} />
              );
            }

            const section = getSectionById(id);
            if (!section) {
              return null;
            }

            if (section.id === SERVICES_SECTION_ID) {
              return (
                <ServicesSection
                  deliveryLabel={ui.servicesDeliveryLabel}
                  detailPageCtaLabel={ui.servicesDetailPageCta}
                  detailsCtaLabel={ui.servicesDetailsCta}
                  id={section.id}
                  key={section.id}
                  kicker={ui.servicesKicker}
                  launchAddonTitle={ui.servicesLaunchAddonTitle}
                  otherServicesTitle={ui.servicesOtherTitle}
                  primaryCtaLabel={ui.servicesPrimaryCta}
                  primaryCtaLabels={ui.servicesPrimaryCtaLabels}
                  recommendedBadgeLabel={ui.servicesRecommendedBadgeLabel}
                  sectionRef={servicesSectionRef}
                  serviceCards={section.serviceCards}
                  serviceContextNote={section.serviceContextNote}
                  serviceDetailHrefs={{
                    landing: landingPageServiceHref,
                  }}
                  serviceOptions={ui.servicesIntentOptions}
                  servicePickerTitle={ui.servicesIntentTitle}
                  serviceSecondaryTitle={section.serviceSecondaryTitle}
                  title={section.title}
                />
              );
            }

            if (section.id === PROOF_SECTION_ID) {
              if (!showProofSection) {
                return null;
              }

              return (
                <ProofSection
                  description={section.description}
                  featuredProject={section.proofFeaturedProject}
                  highlightsAriaLabel={ui.proofHighlightsAriaLabel}
                  id={section.id}
                  key={section.id}
                  moreProjects={section.proofMoreProjects}
                  ratingAriaLabel={
                    section.proofRatingAriaLabel ?? ui.proofRatingAriaLabel
                  }
                  reviewLinkLabel={
                    section.proofReviewLinkLabel ?? ui.proofReviewLinkLabel
                  }
                  reviews={section.proofReviews}
                  summaryPoints={section.summaryPoints}
                  title={section.title}
                />
              );
            }

            if (section.id === PROCESS_SECTION_ID) {
              return (
                <ProcessSection
                  description={section.description}
                  id={section.id}
                  key={section.id}
                  processCta={section.processCta}
                  processSteps={section.processSteps}
                  summaryPoints={section.summaryPoints}
                  title={section.title}
                />
              );
            }

            if (section.id === FAQ_SECTION_ID) {
              return (
                <QAndASection
                  description={section.description}
                  id={section.id}
                  items={section.qnaItems}
                  key={section.id}
                  secondaryContact={section.qnaSecondaryContact}
                  title={section.title}
                />
              );
            }

            if (section.id === CONTACT_SECTION_ID) {
              const contactFormOfferKeys = Object.values(
                CANONICAL_CONTACT_OFFER_KEY_BY_GROUP,
              );
              const contactFormOffers = contactFormOfferKeys.flatMap(
                (offerKey) => {
                  const card = servicesSection.serviceCards.find(
                    (serviceCard) => serviceCard.key === offerKey,
                  );

                  return card
                    ? [
                        {
                          key: card.key,
                          title: card.title,
                        },
                      ]
                    : [];
                },
              );
              const privacyHref = createLocalePathname(
                SITE_ROUTES.PRIVACY,
                locale,
              );

              if (contactFormOffers.length !== contactFormOfferKeys.length) {
                throw new Error(
                  "Expected contact form offer cards to be available.",
                );
              }

              return (
                <ContactSection
                  contactAlternativeLabel={section.contactAlternativeLabel}
                  contactChannels={section.contactChannels}
                  contactDecisionIntro={section.contactDecisionIntro}
                  contactForm={section.contactForm}
                  contactFormOffers={contactFormOffers}
                  contactSecondaryCta={section.contactSecondaryCta}
                  discoveryCallForm={section.discoveryCallForm}
                  id={section.id}
                  key={section.id}
                  privacyHref={privacyHref}
                  quickContactForm={section.quickContactForm}
                  title={section.title}
                />
              );
            }

            return null;
          })}
        </LayoutShell>

        <FooterSection
          description={footerSection.description}
          locale={locale}
          navColumn={footerSection.navColumn}
        />
      </main>
    </>
  );
}
